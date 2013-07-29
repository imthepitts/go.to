// go.to requires global window, jQuery, and Array.reduce()
(function(window, $){
    "use strict";
    
    // Set go.to instance to global variable "go"
    window.go = function(routes, controllers, options) {
        
        // Set default options
        var defaultOptions = {
            rootPath:'', 
            bindHashClicks: true
        };
        
        var options = options || {}; 
        
        for (var option in defaultOptions){
            if (typeof options[option] === 'undefined'){
                options[option] = defaultOptions[option];
            }
        }
        
        // Bind hash anchor click events to go.to routes (options.bindHashClicks)
        if (options.bindHashClicks){
            var $hashes = $('a[href*="#"]');
            
            $hashes.each(function(i, element){
                var $this = $(this);
                var href = $this.attr('href');
                var hash = href.substring(href.indexOf('#')+1);
                var pathname = href.substring(0, href.indexOf('#'));
                if (hash.length && pathname === location.pathname){
                    $this.on('click', function(event){
                        // This "self" refers to hoisted "self" just before constructor return statement
                        // Pass "this" (the clicked element) as the target to distinguish it from a normal page load
                        self.to(pathname, hash, this);
                    });
                }
            });            
        }

        /*
         * Parses the current route and executes mapped handler/controller
         * 
         * .to(string route[, string subroute, object target])
         *      @route string - Path of the current window location, relative to the root path specified in options.rootPath. Must start with forward slash, indicating a URL path (/index.htm).
         *      @subroute string - Hash of the current window location, if exists. Do not include pound sign if passing subroute manually ("subroute", not "#subroute").
         *      @target object - The target DOM object (window or anchor). Default is window.
         * 
         * .to(object location[, null, object target])
         *      @location object - window.location object. Route and subroute are automatically parsed from location.pathname and location.hash.
         *      @target object - The target DOM object (window or anchor). Default is window.
         *      
         * .to(string navigator[, null, object target])
         *      @navigator string - Shortcut name for manually invoking a route/handler. Simple string corresponding to the navigator property of a route definition: "/index.htm": {navigator: "home"}. Cannot begin with "/" or "#".
         *      @target object - The target DOM object (window or anchor). Default is window.
         */
        var to = function(route, subroute, target) {
            
            // If route was passed via window.location, split it into discreet route, subroute arguments without #
            if (typeof route === 'object'){
                subroute = (route.hash && route.hash.length ? route.hash.replace('#', '') : null);
                route = route.pathname;
            }
                        
            target = target || window;
                        
            var 
                // Placeholder for evaluating each route
                endPoint = '',
                
                // Switch for determining if route needs to be run before executing subroute
                runParentRouteFirst = false,
                
                // Ensure routePath is relative to the application root (options.rootPath)
                routePath = route.substring(
                    (options.rootPath === route.substring(0, options.rootPath.length) ? options.rootPath.length : 0), 
                    route.length
                ),
                
                // Default handler to invoke
                handler = function(go){
                    // If no route found, try to find navigator link                    
                    navigate(route, go);
                },
                
                // Map dot notation path to same path in controllers object
                mapStringToEndPoint = function(path){
                    
                    // Ensure Array.reduce() is available to go.to
                    return path.split('.').reduce(
                        function(obj, i) {
                            return (typeof obj[i] === 'undefined' ? {} : obj[i]);
                        },
                        controllers
                    );
                },
                
                // Map dot notation path to end point handler function
                mapStringToHandler = function(endPoint){
                    endPoint = mapStringToEndPoint(endPoint, controllers);
                    if (typeof endPoint === 'function'){
                        return endPoint;
                    }
                    return handler;
                },

                // Find route for shortcut navigation ("navigator" property within route definition)
                navigate = function(to, go){
                    var map = {};
                    
                    // Create a map of the all the navigators to routes/subroutes
                    if (!go.navigators){
                        for (var route in routes){
                            if (routes[route].navigator){
                                map[routes[route].navigator] = {pathname: route, hash: null};
                            }
                            if (routes[route].subroutes){
                                for (var subroute in routes[route].subroutes){
                                    if (routes[route].subroutes[subroute].navigator){
                                        map[routes[route].subroutes[subroute].navigator] = {pathname: route, hash: subroute.substring(1, subroute.length)};
                                    }
                                }
                            }
                        }
                        go.navigators = map;
                    }

                    // Found the route!
                    if (go.navigators[to]){
                        
                        // Already at this location, just invoke the handler
                        if (location.pathname === options.rootPath + go.navigators[to].pathname){
                            go.to(go.navigators[to]);
                            if (go.navigators[to].hash){
                                location.hash = go.navigators[to].hash;
                            }

                        // Redirect to route location 
                        } else {
                            location.href = options.rootPath + go.navigators[to].pathname + (go.navigators[to].hash ? go.navigators[to].hash : '');
                        }
                    }
                },
                
                // Assign handler based on endPoint data type, return success/failure
                assignHandler = function(endPoint){
                    return {
                        'string': function(endPoint){
                            handler = mapStringToHandler(endPoint);
                            return true;
                        }, 
                        'function': function(endPoint){
                            handler = endPoint;
                            return true;
                        },
                        'object': function(){
                            return false;
                        }
                    }[typeof endPoint](endPoint);
                }
            ;
            
            // Check top-level route end point
            if (routes[routePath]){
                endPoint = routes[routePath];                
                if (assignHandler(endPoint)){
                    routes[routePath].handler = handler;
                    
                // Check for subroute end point before calling top-level handler                    
                } else if (subroute && routes[routePath].subroutes && routes[routePath].subroutes['#' + subroute]){
                    
                    // Get subroute endpoint
                    endPoint = routes[routePath].subroutes['#' + subroute];                    
                    if (assignHandler(endPoint)){
                        runParentRouteFirst = true;

                    // Subroute end point has handler?
                    } else if (endPoint.handler){
                        endPoint = endPoint.handler;
                        if (assignHandler(endPoint)){
                            runParentRouteFirst = true;
                        }
                    }
                
                // No matching subroutes, so just call the top-level handler, if it exists
                } else if (endPoint.handler){
                    endPoint = endPoint.handler;
                    if (assignHandler(endPoint)){
                        routes[routePath].handler = handler;
                    }
                }
            }
            
            // Ensure parent route handler runs before subroute 
            if (runParentRouteFirst){
                to.call(this, route);
            }
            
            // Invoke the handler, passing in "go" instance, which provides the instance to all handlers/controllers
            handler(this, target);
            
            // Prevent top-level route from running again
            if (routes[routePath]){ 
                routes[routePath].handler = function(){};
            }
            
            // Enable event chaining and whatnot
            return this;
            
        };
        
        // Hash anchor click binding relies on hoisting this "self" variable for proper reference to go.to instance
        var self = {
                    
            to: to,            
            routes: routes,
            controllers: controllers,
            options: options
            
        };
        
        // Return only the public methods and properties
        return self;
    }
    
// Requires jQuery for hash anchor click binding
})(window, jQuery);
