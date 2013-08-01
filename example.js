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
