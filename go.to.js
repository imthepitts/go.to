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
                        self.to(pathname, hash);
                    });
                }
            });            
        }
                
        // Route to the handler/controller
        var to = function(route, subroute) {
            
            // If route was passed via window.location, split it into discreet route, subroute arguments without #
            if (typeof route === 'object' && route.pathname){
                subroute = (route.hash && route.hash.length ? route.hash.replace('#', '') : null);
                route = route.pathname;
            }
                        
            var 
                // Placeholder for evaluating each route
                endPoint = '',
                
                // Ensure routePath is relative to the application root (options.rootPath)
                routePath = route.substring(
                    (options.rootPath === route.substring(0, options.rootPath.length) ? options.rootPath.length : 0), 
                    route.length
                ),
                
                // Default handler to invoke
                handler = function(go){
                    // If no route found, try to find navigator link                    
                    navigate(route, go.routes);
                },
                
                // Map dot notation path to same path in controllers object
                mapStringToEndPoint = function(path){
                    
                    // Ensure Array.reduce() is available to go.to
                    return path.split('.').reduce(
                        function(obj, i) {
                            return obj[i];
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
                navigate = function(to, routes, subroutes, selectedRoute){
                    var theseRoutes = subroutes || routes;
                    
                    // Check top level routes (location path names)
                    for (var route in theseRoutes){
                        
                        // Check subroutes (location hashes)
                        if (theseRoutes[route].subroutes){
                            navigate(to, routes, routes[route].subroutes, route);
                        }
                        
                        // Route found!
                        if (theseRoutes[route].navigator === to){
                            var currentRoute = (selectedRoute ? selectedRoute + route : route);
                        
                            // Already at this location, just invoke the handler
                            if (location.pathname + location.hash === options.rootPath + currentRoute){
                                this.to(location);
                        
                            // Redirect to route location 
                            } else {
                                location.href = options.rootPath + currentRoute;
                            }
                            break;
                        }
                    }
                }, 
                
                // Assign handler based on endPoint data type, return success/failure
                assignHandler = function(endPoint, type){
                    if (type === 'function' && typeof endPoint === type){
                        handler = endPoint;
                        return true; 
                    } else if (type === 'string' && typeof endPoint === type){
                        handler = mapStringToHandler(endPoint);
                        return true;
                    }
                    return false;
                }
            ;
            
            // Check top-level route end point
            if (routes[routePath]){

                endPoint = routes[routePath];
                
                if (assignHandler(endPoint, 'string')){
                    // assigned                    
                } else if (assignHandler(endPoint, 'function')){
                    // assigned
                    
                // Check for subroute end point before calling top-level handler                    
                } else if (subroute && routes[routePath].subroutes['#' + subroute]){
                                        
                    endPoint = routes[routePath].subroutes['#' + subroute];
                    
                    if (assignHandler(endPoint, 'string')){
                        // assigned
                    } else if (assignHandler(endPoint, 'function')){
                        // assigned
                    } else if (endPoint.handler){
                                    
                        endPoint = endPoint.handler;
                        
                        if (assignHandler(endPoint, 'string')){
                            // assigned
                        } else if (assignHandler(endPoint, 'function')){
                            // assigned                            
                        }
                    }
                
                // No matching subroutes, so just call the top-level handler, if it exists
                } else if (endPoint.handler){
                    
                    endPoint = endPoint.handler;
                    
                    if (assignHandler(endPoint, 'string')){
                        // assigned
                    } else if (assignHandler(endPoint, 'function')){
                        // assigned
                    }                    
                }
            }
            
            // Invoke the handler, passing in "go" instance, which provides the instance to all handlers/controllers
            handler(this);
            
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
