// go.to requires global window, jQuery, and Array.reduce()
(function(window, $){
    "use strict";
    
    // Set go.to instance to global variable "go"
    window.go = function(routes, controllers, options) {
        
        // Set defaults for controllers and options
        var 
            controllers = controllers || {},
            options = options || {},

            defaultOptions = {
                rootPath: '', 
                bindHashClicks: true,
                ignoreCase: true,
                ignoreSlash: true
            }, 

            // Placeholder for lowercasing routes
            replacer = '';
        ;

        // Set option defaults into options
        for (var option in defaultOptions){
            if (typeof options[option] === 'undefined'){
                options[option] = defaultOptions[option];
            }
        }

        // Convert route to lowercase for case-insensitve routing
        if (options.ignoreCase){
            for (var item in routes){
                if (routes[item].subroutes){
                    for (var sub in routes[item].subroutes){
                        replacer = sub.toLowerCase();
                        if (sub !== replacer){
                            routes[item].subroutes[replacer] = routes[item].subroutes[sub];
                            delete routes[item].subroutes[sub];
                        }                        
                    }
                }
                replacer = item.toLowerCase();
                if (item !== replacer){
                    routes[replacer] = routes[item];
                    delete routes[item];
                }
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
                if (hash.length && pathname === window.location.pathname){
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
         * .to(string navigator[, redirect, object target])
         *      @navigator string - Shortcut name for manually invoking a route/handler. Simple string corresponding to the navigator property of a route definition: "/index.htm": {navigator: "home"}. Cannot begin with "/" or "#".
         *      @redirect boolean - Specify if navigator should be invoked via redirect. Default is false (no redirect).
         *      @target object - The target DOM object (window or anchor). Default is window.
         */
        var to = function(route, subroute, target) {
            
            target = target || window;

            // If route was passed via window.location, split it into discreet route, subroute arguments without #
            if (typeof route === 'object'){
                subroute = (route.hash && route.hash.length ? route.hash.replace('#', '') : null);
                route = route.pathname;
            }
            
            // Convert route to lowercase for case-insensitve routing
            if (options.ignoreCase && route.charAt(0) === '/'){
                route = route.toLowerCase();
                if (typeof subroute === 'string'){
                    subroute = subroute.toLowerCase();
                }
            }

            // Remove trailing slash if ignoring slash
            if (options.ignoreSlash){
                route = route.replace(/\/$/, '');
            }
            
            var 
                // Placeholder for evaluating each route
                endPoint = '',
                                
                // Ensure routePath is relative to the application root (options.rootPath)
                routePath = route.substring(
                    (options.rootPath === route.substring(0, options.rootPath.length) ? options.rootPath.length : 0), 
                    route.length
                ),

                // Route handlers
                handlers = {

                    // Functions to execute in before route hook
                    before: function(){
                    }, 

                    // Primary handler to invoke
                    handler: function(go){
                        // If no route found, try to find navigator link
                        navigate.call(go, route, subroute === true);
                    },

                    // Functions to execute in after route hook
                    after: function(){
                    }
                },

                // Queue for processing handlers in correct order
                handlerQueue = [],
                
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
                    return handlers.handler;
                },

                // Find route for shortcut navigation ("navigator" property within route definition)
                navigate = function(to, redirect){
                    var map = {};
                    
                    // Create a map of the all the navigators to routes/subroutes
                    if (!this.navigators){
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
                        this.navigators = map;
                    }

                    // Found the route!
                    if (this.navigators[to]){

                        // Already at this location, just invoke the handler
                        if (window.location.pathname === options.rootPath + this.navigators[to].pathname){
                            this.to(this.navigators[to]);

                            // Add the hash, if it exists
                            if (this.navigators[to].hash){
                                window.location.hash = this.navigators[to].hash;
                            }

                        // Redirect to route location, if specified, else just invoke the handler
                        } else {
                            if (redirect){
                                window.location.href = options.rootPath + this.navigators[to].pathname + (this.navigators[to].hash ? this.navigators[to].hash : '');
                            } else {
                                this.to(this.navigators[to]);
                            }
                        }
                    }
                },
                
                // Assign handler based on endPoint data type, return success/failure
                assignHandler = function(endPoint, handlerType){
                    handlerType = handlerType || 'handler';
                    return {
                        'string': function(endPoint){
                            handlers[handlerType] = mapStringToHandler(endPoint);
                            return true;
                        }, 
                        'function': function(endPoint){
                            handlers[handlerType] = endPoint;
                            return true;
                        },
                        'object': function(){
                            return false;
                        }
                    }[typeof endPoint](endPoint);
                },

                fetchHandler = function(routePath, subroute, handlerType){

                    // Switch for determining if route needs to be run before executing subroute
                    var runParentRouteFirst = false;

                    // Check for before/after route hook handler
                    var assignHookHandler = function(handlerType){
                        if (routes[handlerType]){
                            assignHandler(routes[handlerType], handlerType);
                        }
                    };

                    // Before/after route hook handler found, assign it and return it
                    if ({before:true, after:true}[handlerType]){
                        assignHookHandler(handlerType);
                        return handlers[handlerType];
                    }

                    // Check top-level route end point
                    if (routes[routePath]){
                        endPoint = routes[routePath];
                        if (assignHandler(endPoint, handlerType)){
                            routes[routePath].handler = handlers.handler;
                            
                        // Check for subroute end point before calling top-level handler
                        } else if (subroute && routes[routePath].subroutes && routes[routePath].subroutes['#' + subroute]){
                            
                            // Subroute end point IS a handler?
                            endPoint = routes[routePath].subroutes['#' + subroute];
                            if (assignHandler(endPoint, handlerType)){
                                runParentRouteFirst = true;

                            // Subroute end point HAS a handler?
                            } else if (endPoint.handler){
                                endPoint = endPoint.handler;
                                if (assignHandler(endPoint, handlerType)){
                                    runParentRouteFirst = true;
                                }
                            }

                            // Subroute found, fetch the parent route
                            if (runParentRouteFirst){
                                fetchHandler(routePath, null, 'parent');
                            }

                        
                        // No matching subroutes, so just call the top-level handler, if it exists
                        } else if (endPoint.handler){
                            endPoint = endPoint.handler;
                            if (assignHandler(endPoint, handlerType)){
                                routes[routePath].handler = handlers.handler;
                            }
                        }
                    }

                    // Return the fetched handler
                    return handlers[handlerType];
                }
            ;

            // Queue pre-route handler, if it exists, then delete it to prevent from running again
            if (routes.before && route !== 'before'){
                handlerQueue.push(fetchHandler(null, null, 'before'));
                delete routes.before;
            }

            // Fetch the primary handler (parent route will be set, if it exists)
            handlers.handler = fetchHandler(routePath, subroute, 'handler');

            // Queue parent route handler, if subroute requires it
            if (handlers.parent){
                handlerQueue.push(fetchHandler(route, null, 'parent'));
            }

            // Queue primary handler, now that parent has been queued
            handlerQueue.push(handlers.handler);

            // Queue after-route handler, if it exists, then delete it to prevent from running again
            if (routes.after && route !== 'after'){
                handlerQueue.push(fetchHandler(null, null, 'after'));
                delete routes.after;
            }

            // Execute all handlers in the queue
            for (var i = 0; i < handlerQueue.length; i++){
                if (typeof handlerQueue[i] === 'function'){

                    // Invoke the handler, passing in "go" instance, which provides the instance to all handlers/controllers
                    // Set "this" scope to the controllers JSON map
                    handlerQueue[i].call(controllers, this, target);
                }
            }

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
