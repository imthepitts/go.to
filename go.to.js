var go = function (routes, model) {
  
    return {
    
        to: function (route) {        
            
            routes[route](model);
            return this;
            
        }, 
        
        route: function (route) {
        
            return routes[route];
        
        },
        
        model: function () {
        
            return model;
        
        }
    
    };
};
