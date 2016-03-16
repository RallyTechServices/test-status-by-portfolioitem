Ext.define('Rally.technicalservices.Toolbox',{
    singleton: true,
    fetchWsapiRecords: function(config){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store', config).load({
            callback: function(records, operation, success){
                if (success){
                    deferred.resolve(records);
                } else {
                    deferred.reject(Ext.String.format("Error getting {0} for {1}: {2}",config, operation.error.errors.join(',')));
                }
            }
        });
        return deferred;
    },
    fetchPortfolioItemTypes: function(){
        var deferred = Ext.create('Deft.Deferred'),
            store = Ext.create('Rally.data.wsapi.Store', {
                model: 'TypeDefinition',
                fetch: ['TypePath', 'Ordinal','Name'],
                filters: [
                    {
                        property: 'Parent.Name',
                        operator: '=',
                        value: 'Portfolio Item'
                    },
                    {
                        property: 'Creatable',
                        operator: '=',
                        value: 'true'
                    }
                ],
                sorters: [{
                    property: 'Ordinal',
                    direction: 'ASC'
                }]
            });

        store.load({
            callback: function(records, operation, success){
                if (success){
                    var portfolioItemTypes = new Array(records.length);
                    _.each(records, function(d){
                        //Use ordinal to make sure the lowest level portfolio item type is the first in the array.
                        var idx = Number(d.get('Ordinal'));
                        portfolioItemTypes[idx] = d.getData();
                    });
                    deferred.resolve(portfolioItemTypes);
                } else {
                    var error_msg = '';
                    if (operation && operation.error && operation.error.errors){
                        error_msg = operation.error.errors.join(',');
                    }
                    deferred.reject('Error loading Portfolio Item Types:  ' + error_msg);
                }
            }
        });
        return deferred.promise;
    }
});