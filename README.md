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
go.to requires jQuery and Array.reduce() ([use a shim to enable Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FArray%2FReduce#Compatibility) on older browers). jQuery is only required if using automatic binding of hash anchor click events (turned on by default).

Features & Behavior
-------------------
go.to is based entirely on the assumption that it will be used to run bits of JavaScript code on a page by page basis. So if the user browses to `/index.htm`, go.to will only run the section of code that is mapped to that path (using `window.location.pathname`).

If a hash location is specified in the URL (`window.location.hash`) as `/search.htm#advanced`, go.to will first run any code mapped to the route `/search.htm` and then it will run any code mapped to the subroute `#advanced`. 

**IMPORTANT:** go.to will only run the parent route code once per page load (e.g. `/search.htm`), even if the route is explicitly called later. This helps to ensure event bindings within the route don't get bound multiple times.

Routes can have shortcuts, called "navigators" defined in the routes JSON map. This allows a particular route to be explicitly called by that shortcut name: `go.to('advancedSearch')` instead of `go.to('/search.htm', '#advanced)`.

**Feature Summary:**

* Automatically routes `window.location` (pathname and hash) to a predefined function on page load.
* `route` corresponds to the URL path, and `subroute` corresponds to the hash, if it exists.
* Parent routes are only run once per page load, even if explicitly called later. 
* Parent routes will automatically be run for a subroute, if the parent hasn't already been run.
* Navigators are shortcuts that can be assigned to routes and called explicitly via `go.to('navigatorName')`.

Constructor
-----------
Create an instance of go.to by calling `go()`. You can have multiple instances of go.to, but probably not a common use case.

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
        // Run this function before every route is executed
        before: function(){
            console.log('before');
        },
        
        // Function literal
        "/hello.htm": function(go, target){
            console.log('Hello World!');
        },
        
        // Path to controller as string (must be a string if the controller is passed in as a literal JSON map)
        // String route definitions will not perform as well as function literals or external object/methohd references
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
        "/external.htm": obj.foo, 

        // Run this function after every route is executed
        after: function(){
            console.log('after');
        }
        
    }, 

    // Controllers
    {
        app: {
            
            home: function(go, target){
                console.log('home');
                // Invoke basic search handler via redirect
                go.to('basicSearch', true);
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

> `@route string` - Path of the current window location, relative to the root path specified in options.rootPath. Must start with forward slash, indicating a URL path (/index.htm). Route case and any trailing slashes are ignored by default.

> `@subroute string` - Hash of the current window location, if exists. Do not include pound sign if passing subroute manually ("subroute", not "#subroute"). Subroute case is ignored by default.

> `@target object` - The target DOM object (window or anchor). Default is window.
        
    .to(object location[, null, object target])
> `@location object` - window.location object. Route and subroute are automatically parsed from location.pathname and location.hash.

> `@target object` - The target DOM object (window or anchor). Default is window.
        
    .to(string navigator[, redirect, object target])
> `@navigator string` - Shortcut name for manually invoking a route/handler. Simple string corresponding to the navigator property of a route definition: "/index.htm": {navigator: "home"}. Cannot begin with "/" or "#". Navigator is always case sensitive.

> `@redirect boolean` - Specify if navigator should be invoked via redirect. Default is false (no redirect).

> `@target object` - The target DOM object (window or anchor). Default is window.

Options
-------
There are a few options that can be passed into the constructor.

```
{
    rootPath: '/some/path',
    bindHashClicks: true,
    ignoreCase: true,
    ignoreSlash: true
}
```
> `rootPath`: default = `''` - Path from root of site where the application lives. The value of `rootPath` will be prefixed onto the route paths specified in the routes JSON map. If the application lives in the root, rootPath should be omitted or set to empty string (`rootPath: ''`).

> `bindHashClicks`: default = `true` - Specified if anchors with hrefs containing "#" should be automatically bound to any corresponding subroutes on click. If clicked, go.to runs the subroute handler.

> `ignoreCase`: default = `true` - Ignores case of routes and subroutes. Only applies to routes. Navigators are always case-sensitive.

> `ignoreSlash`: default = `true` - Ignores trailing slash in route.

Properties
----------
All arguments passed into `go()` constructor are available as public properties:

    .routes
    .controllers
    .options
    
If a navigator is called, go.to creates a public map of all navigators to their corresponding route paths.

    .navigators
    
Handlers
--------
Handlers are the functions that ultimately get invoked by running the route. There are four kinds. Here they are in the order they would be run if all of them were queued for a single route:

1. Before - If defined, runs any pre-route code defined in the routes JSON map.
2. Parent - If a subroute is being executed, parent route is run before the subroute.
3. Primary - The actual route intended to be run.
4. After - If defined, runs any post-route code defined in the routes JSON map.

Handlers are called by go.to and automatically passed two arguments:

    handler(object go, object target)

> `@go object` - The current instance of go.to. Useful for calling additional routes from within the handler.

> `@target object` - The target DOM object (window or anchor). Default is window. Useful for determining how the route was executed -- either a click on a bound hash anchor (`<a href="#subrouteName">Do Subroute</a>`) or the loading of the page (window).

NOTE: Handlers are called with the controllers JSON map set as "this", so any reference to "this" within the handler function will point to the controllers JSON map.
    

**Example:**
```javascript
// Routes
{
    
    before: function(go, target){
        doThisFirst();
    },
    
    '/route/path.htm': 'app.someHandler'
    
    after: function(go, target){
        doThisLast();
    }
    
    
}
...

// Controllers
{
    
    app: {
        
        someHandler: function(go, target){
            doThisThing();
            this.app.otherHandler(go, target);
        },
        
        otherHandler: function(go, target){
            doThisToo();
        }
        
    }
    
}

```

License
-------
Free. As in beer.
