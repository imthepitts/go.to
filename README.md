go.to
=====

Simple URL routing for lazy JavaScript developers.

Overview
--------
go.to routes the window location (pathname and hash) to a function that runs whatever code is required for that location. Routes can be also be invoked directly if a navigator (shortcut) is defined for that route `go.to('foo')`.


Why You Might Need go.to
------------------------
You have a moderate amount of JavaScript code, and it's getting confusing which bits you need for which page in your application. You'd like to break it into chunks based on the current URL so that each page's scripts are together and can easily be run all at once.

**A checklist of sorts:**

* You don't like adding page-specific code as inline scripts directly in your HTML.
* You also don't like having a separate .js file to include for each page.
* You'd like to be able to easily call a chunk of code from some other page in a new page without resorting to copy/paste.
* You don't want to get roped into some other gargantuan, confusing JS framework that starts bossing you around about how you build your application
* You appreciate the nostalgia of [goto](http://en.wikipedia.org/wiki/Goto) statements from days gone by.


Dependences
-----------
go.to requires jQuery and Array.reduce() (use a shim to enable Array.reduce() on older browers). jQuery is only required if using automatic binding of hash anchor click events (turned on by default).


Constructor
-----------
Create an instance of go.to by calling `go()`. (Any subsequent instantiation of go.to will overwrite the previous. In the end, there can only be one!)

    go(routes[, controllers, options])

> `@routes map` - JSON map of route paths ('/index.htm') and subroute hashes ('#home') to their corresponding handler/controller. Function literals can be used in routes instead of mapping to the controller.

> `@controllers map` - Optional JSON map or external object reference to which the routes are mapped. The function that corresponds to the routes mapping will be executed.

> `@options map` - Optional JSON map of options for this instance of go.to

**Example Instantiation and Invocation:**

```javascript
// Create external object to be invoked as route handlers
var obj = {
    foo: function(go, target){
        console.log('External \'foo\'');
    }, 
    bar: function(go, target){
        console.log('External  \'bar\'');
    }
};

go(
    
    // Route mappings
    {
        // Function literal
        "/hello.htm": function(go, target){
            console.log('Hello World!');
        },
        
        // Path to controller as string (must be a string if the controller is passed in as a literal JSON map)
        // String route definitions will not perform as well as function literals or externa object/methohd references
        "/index.htm": "app.home",

        // Route config map to specify handler, navigator, and subroutes
        "/search.htm": {        
            
            // Handler to invoke        
            handler: "app.search",
            
            // Shortcut name for this route
            navigator: "basicSearch",

            // Subroutes
            subroutes: {
                "#advanced": {
                    handler: "app.advancedSearch",
                    navigator: "advancedSearch"
                }
            }
        },
        
        "/results.htm": {
            handler: "app.results",
            navigator: "results"
        },
        
        // External object/function
        "/external.htm": obj.foo
        
    }, 

    // Controllers
    {
        app: {
            
            home: function(go, target){
                console.log('home');
                go.to('basicSearch');
            },

            search: function(go, target){
                console.log('search');
                go.to('advancedSearch');
            },
            
            advancedSearch: function(go, target){
                console.log('advancedSearch');
                obj.bar();
            },
            
            results: function(go, target){
                console.log('results');
            }
            
        }
    },
    
    // Options
    {
        rootPath: '/test',
        bindHashClicks: true
    }

).to(window.location);
```

Methods
-------

`.to()` - *Parses the current route and executes mapped handler/controller*

**Method Signatures**:

    .to(string route[, string subroute, object target])

> `@route string` - Path of the current window location, relative to the root path specified in options.rootPath. Must start with forward slash, indicating a URL path (/index.htm).

> `@subroute string` - Hash of the current window location, if exists. Do not include pound sign if passing subroute manually ("subroute", not "#subroute").

> `@target object` - The target DOM object (window or anchor). Default is window.
        
    .to(object location[, null, object target])
> `@location object` - window.location object. Route and subroute are automatically parsed from location.pathname and location.hash.

> `@target object` - The target DOM object (window or anchor). Default is window.
        
    .to(string navigator[, null, object target])
> `@navigator string` - Shortcut name for manually invoking a route/handler. Simple string corresponding to the navigator property of a route definition: "/index.htm": {navigator: "home"}. Cannot begin with "/" or "#".

> `@target object` - The target DOM object (window or anchor). Default is window.

Properties
----------
All arguments passed into `go()` constructor are available as public properties:

    .routes
    .controllers
    .options
    
If a navigator is called, go.to creates a public map of all navigators to their corresponding route paths.

    .navigators

License
-------
Free. As in beer.
