Ext.define("test-status-by-portfolio-item", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            selectPortfolioType: 'PortfolioItem/Theme',
            commentsField: 'Notes'
        }
    },
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box'}
    ],

    integrationHeaders : {
        name : "test-status-by-portfolio-item"
    },

    featureFetch: ['ObjectID','Name'], //['ObjectID','FormattedID','Name','PlannedStartDate','PlannedEndDate'],
    testCaseFetch: ['ObjectID','FormattedID','WorkProduct','Type','LastVerdict','LastRun'],

    launch: function() {
        Rally.technicalservices.Toolbox.fetchPortfolioItemTypes().then({
            success: function(portfolioItemTypes){
                this.portfolioItemTypes = portfolioItemTypes;
                this._addSelector();
            },
            failure: function(msg){
                this._showError(msg);
            },
            scope: this
        });
    },
    _addSelector: function(){
        var portfolioItemType = this.getSetting('selectPortfolioType');

        this.removeAll();

        var cb = this.add({
            xtype: 'rallycombobox',
            itemId: 'cb-portfolio-item',
            fieldLabel: 'Portfolio Item',
            labelAlign: 'right',
            storeConfig: {
                model: portfolioItemType,
                remoteFilter: false,
                autoLoad: true
            },
            width: 300
        });
        cb.on('change', this._fetchGridboardData, this);
    },
    _showError: function(msg){
        Rally.ui.notify.Notifier.showError({message: msg});
    },
    _fetchGridboardData: function(cb){
        var portfolioItem = cb.getRecord(),
            featureConfig = this._getFeatureConfig(portfolioItem),
            me = this;

        this.logger.log('_fetchGridboardData',featureConfig, portfolioItem);

        if (this.down('rallygridboard')){
            this.down('rallygridboard').destroy();
        }

        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: featureConfig.models,
            enableHierarchy: true,
            autoLoad: true
        }).then({
            success: function (store) {
                //store.on('load', this._fetchUserStories, this);
                me.add({
                    xtype: 'rallygridboard',
                    context: this.getContext(),
                    modelNames: featureConfig.models,
                    toggleState: 'grid',
                    stateful: false,
                    stateId: this.getContext().getScopedStateId('grid-xyz'),
                    gridConfig: {
                        store: store,
                        storeConfig: {
                            filters: featureConfig.filters
                        },
                        columnCfgs: this._getColumnCfgs()
                    },
                    height: this.getHeight()
                });
            },
            failure: function(msg){
                me._showError(msg);
            },
            scope: me
        });
    },
    _fetchData: function(cb){
        var portfolioItem = cb.getRecord(),
            featureConfig = this._getFeatureConfig(portfolioItem);

        Rally.technicalservices.Toolbox.fetchWsapiRecords(featureConfig).then({
            success: function(records){
                this.logger.log('fetchWsapiRecords', records);
                this._fetchUserStories(records);
            },
            failure: function(msg){
                this._showError(msg);
            },
            scope: this
        });

    },
    _fetchUserStories: function(records){
        this.logger.log('_fetchUserStories', records);
        var configs = this._getStoryConfigs(records),
            promises = _.map(configs, function(config) { return Rally.technicalservices.Toolbox.fetchWsapiRecords(config); });

        Deft.Promise.all(promises).then({
            success: function(results){
                this.logger.log('_fetchUserStories', configs, results);
                var userStories = _.flatten(results);
                this._fetchTestCases(records, userStories);
            },
            failure: function(msg){
                this._showError(msg);
            },
            scope: this
        });
    },
    _fetchTestCases: function(features, userStories){
        var configs = this._getTestCaseConfigs(userStories),
            promises = _.map(configs, function(config) { return Rally.technicalservices.Toolbox.fetchWsapiRecords(config); });

        Deft.Promise.all(promises).then({
            success: function(results){
                this.logger.log('_fetchTestCases', configs, results);
               // var store = this._buildCustomStore(features, userStories, _.flatten(results));
                //this._displayGrid(store);
            },
            failure: function(msg){
                this._showError(msg);
            },
            scope: this
        });
    },
    _buildCustomStore: function(portfolioItems, userStories, testCases){
        this.logger.log('_buildCustomStore', portfolioItems, userStories, testCases);
        var testCasesByPortfolioItem = this._getTestCasesByPortfolioItem(userStories, testCases);
        this.logger.log('_buildCustomStore', testCasesByPortfolioItem);

        var data = [];
        _.each(portfolioItems, function(p){
            var row = Ext.create('Rally.technicalservices.PortfolioTestStatusRow',{
                portfolioItem: p,
                testCases: testCasesByPortfolioItem[p.get('ObjectID')] || []
            });
            data.push(row.getDataRow());
        });

        var fields = _.keys(data[0]);
        return Ext.create('Rally.data.custom.Store',{
            data: data,
            fields: fields
        });
    },
    _getTestCasesByPortfolioItem: function(stories, testCases){

        var testCasesByStory = _.reduce(testCases, function(sHash, tc){
            var sid = tc.get('WorkProduct') && tc.get('WorkProduct').ObjectID || null;
            if (sid){
                if (!sHash[sid]){
                    sHash[sid] = [];
                }
                sHash[sid].push(tc);
            }
            return sHash;
        },{});

        var h = {};
        _.each(stories, function(s){
            var feature = s.get('Feature') && s.get('Feature').ObjectID || null,
                sid = s.get('ObjectID');
            console.log('sid',feature,  sid);
            if (feature && testCasesByStory[sid]){
                if (!h[feature]){
                    h[feature] = [];
                }
                h[feature] = h[feature].concat(testCasesByStory[sid]);
                console.log('hash', feature, sid, s.get('TestCaseStatus'), testCasesByStory[sid], _.map(testCasesByStory[sid], function(tc){ return tc.get('FormattedID');}));
            }
        });

        this.logger.log('_buildCustomStore', h);
        return h;
    },
    _getPortfolioItemLevel: function(portfolioItem){
        var idx = -1,
            type = portfolioItem.get('_type').toLowerCase();

        for (var i=0; i<this.portfolioItemTypes.length; i++){
            if (type === this.portfolioItemTypes[i].TypePath.toLowerCase()){
                idx = i;
                i = this.portfolioItemTypes.length;
            }
        }
        return idx;
    },
    _getFeatureConfig: function(portfolioItem){
        var idx = this._getPortfolioItemLevel(portfolioItem);

        var model = this.portfolioItemTypes[0].TypePath.toLowerCase(),
            filterProperty = "ObjectID";
        if (idx > 0) {
            model = this.portfolioItemTypes[idx-1].TypePath.toLowerCase();
            filterProperty = "Parent.ObjectID"
        }

        var filters = [{
            property: filterProperty,
            value: portfolioItem.get('ObjectID')
        }],
            commentsField = this.getSetting('commentsField'),
            fetch = this.featureFetch.concat([commentsField]);

        this.logger.log('_getFeatureConfig',fetch, model, idx, filterProperty, filters);
        return {
            //model: model,
            autoLoad: true,
            models: [model],
            enableHierarchy: true,
            fetch: fetch,
            filters: filters,
            //limit: 'Infinity'
        };
    },
    _getFeatureFieldName: function(){
        this.logger.log('_getFeatureFieldName',this.portfolioItemTypes[0].TypePath,this.portfolioItemTypes[0].TypePath.replace("PortfolioItem/",""));
        return this.portfolioItemTypes[0].TypePath.replace("PortfolioItem/","");
    },
    _getStoryConfigs: function(portfolioItemRecords){
        var idx = portfolioItemRecords.length > 0 ? this._getPortfolioItemLevel(portfolioItemRecords[0]) : 0,
            featureName = this._getFeatureFieldName(),
            fetch = ['ObjectID','TestCaseStatus'].concat([featureName]),
            propertyFilter = [featureName];

        for (var i=0; i<idx; i++){ propertyFilter.push('Parent'); }
        propertyFilter.push('ObjectID');

        var filters = _.map(portfolioItemRecords, function(r){ return {property: propertyFilter.join('.'), value: r.get('ObjectID')};});
        if (portfolioItemRecords.length === 0){
            filters = [{ property: 'ObjectID', value: 0}];
        }

        filters = Rally.data.wsapi.Filter.or(filters);

        filters = filters.and({
            property: 'TestCaseStatus',
            operator: '!=',
            value: ""
        });

        this.logger.log('_getStoryConfig', featureName, fetch, filters.toString());
        return [{
            model: 'HierarchicalRequirement',
            fetch: fetch,
            filters: filters,
            limit: 'Infinity'
        }];
    },
    _getTestCaseConfigs: function(storyRecords){
        var fetch = this.testCaseFetch,
            filters = _.map(storyRecords, function(r){ return {property: "WorkProduct.ObjectID", value: r.get('ObjectID')};});
        this.logger.log('_getTestCaseConfigs', storyRecords, filters);
        if (filters.length === 0){
            filters = [{ property: 'ObjectID', value: 0}];
        }
        filters = Rally.data.wsapi.Filter.or(filters);

        this.logger.log('_getTestCaseConfigs', fetch, filters.toString())

        return [{
            model: 'TestCase',
            fetch: fetch,
            filters: filters,
            limit: 'Infinity'
        }];
    },
    _displayGrid: function(store){
        if (this.down('rallygrid')){
            this.down('rallygrid').destroy();
        }

        this.add({
            xtype: 'rallygrid',
            store: store,
            columnCfgs: this._getColumnCfgs()
        });
    },
    _getColumnCfgs: function(){
        var commentField = this.getSetting('commentsField')
        this.logger.log('_getColumnCfgs', commentField);

        return [{
            dataIndex: 'Name',
            text: 'Name',
            flex: 1
        //}, {
        //    dataIndex: 'total',
        //    text: 'Total'
        //},{
        //    dataIndex: 'actual',
        //    text: 'Actual',
        //    renderer: this._percentRenderer
        //},{
        //    dataIndex: 'plan',
        //    text: 'Planned',
        //    renderer: this._percentRenderer
        //},{
        //    dataIndex: 'passRate',
        //    text: 'Passed',
        //    renderer: this._percentRenderer
        //},{
        //    dataIndex: 'PlannedEndDate',
        //    text: 'Planned End Date'
        //},{
        //    dataIndex: commentField,
        //    text: 'Comments',
        //    flex: 1
        }];
    },
    _percentRenderer: function(v){
        if (v !== null && !isNaN(v)){
            return Math.round(v * 100) + '%';
        }
        return v || '';
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    getSettingsFields: function(settings){

        var filters = [{
            property: 'TypePath',
            operator: 'contains',
            value: 'PortfolioItem/'
        }];

        return [{
            name: 'selectPortfolioType',
            xtype: 'rallycombobox',
            allowBlank: false,
            autoSelect: false,
            shouldRespondToScopeChange: true,
            fieldLabel: 'Portfolio Selector Type',
            labelAlign: 'right',
            labelWidth: 150,
            context: this.getContext(),
            storeConfig: {
                model: Ext.identityFn('TypeDefinition'),
                sorters: [{ property: 'DisplayName' }],
                fetch: ['DisplayName', 'ElementName', 'TypePath', 'Parent', 'UserListable'],
                filters: filters,
                autoLoad: false,
                remoteSort: false,
                remoteFilter: true
            },
            displayField: 'DisplayName',
            valueField: 'TypePath',
            readyEvent: 'ready'
        },{
            name: 'commentsField',
            xtype: 'rallyfieldcombobox',
            labelAlign: 'right',
            labelWidth: 150,
            allowBlank: false,
            fieldLabel: 'Field',
            context: this.getContext(),
            model: 'Portfolioitem'
        }];
    },
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this._addSelector();
    }
});
