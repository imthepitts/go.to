go(

    {
        "/index.htm": function(){
            alert('hello world');
        },

        "/search.htm": {        
        
            "#": "app.search",            
            "#advanced": "app.advancedSearch"            
        }

        

    }, 

    {

        app: {

            search: function(model){                
                // do search stuff
            },
            
            advancedSearch: function(model){            
                // do advanced search stuff            
            }

        }

    }

).to(location.pathname);
