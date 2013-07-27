go(
    
    // Route mappings
    {
        "/hello.htm": function(){
            alert('Hello World!');
        },
        
        "/index.htm": "app.home",

        "/search.htm": {        
        
            handler: "app.search",
            navigator: "basicSearch",
                        
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
        }
        
    }, 

    // Controllers
    {
        app: {
            
            home: function(go){
                console.log('home');
                go.to('basicSearch');
            },

            search: function(go){
                console.log('search');
                go.to('advancedSearch');
            },
            
            advancedSearch: function(go){
                console.log('advancedSearch');
                go.to('results');                
            },
            
            results: function(go){
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
