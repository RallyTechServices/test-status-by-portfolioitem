Ext.override(Rally.ui.grid.TreeGrid, {
    _mergeColumnConfigs: function(newColumns, oldColumns) {

        var mergedColumns = _.map(newColumns, function(newColumn) {
            var oldColumn = _.find(oldColumns, {dataIndex: this._getDataIndex(newColumn)});
            if (oldColumn) {
                return this._getColumnConfigFromColumn(oldColumn);
            }

            return newColumn;
        }, this);

        mergedColumns = mergedColumns.concat(this.config.derivedColumns);
        return mergedColumns;
    }
});

Ext.define('Rally.ui.renderer.template.testcasestatus.PercentDone', {
    requires: [
        'Rally.util.HealthColorCalculator'
    ],
    extend: 'Rally.ui.renderer.template.progressbar.ProgressBarTemplate',

    config: {
        calculateColorFn: function(recordData) {
            return '#7CAFD7';
        },
        isClickable: true
    },

    constructor: function(config) {
        this.initConfig(config);
        return this.callParent(arguments);
    }
});

Ext.override(Rally.ui.renderer.RendererFactory,{

    fieldTemplates: {
        _testcasestatus: function(){
            return Ext.create('Rally.ui.renderer.template.StringTemplate', {
                fieldName: '_testCaseStatus',
                titleCase: true,
                toSpace: ['_']
            });
        },
        _actualtestcases: function(){
            return Ext.create('Ext.XTemplate', '{[this.getPercent(values)]}', {
                getPercent: function(record) {
                    v = record._actualTestCases;
                    if (v !== null && !isNaN(Number(v))){
                        return Math.round(v * 100) + '%';
                    }
                    return v || '--';
                }
            });
        },
        _passrate: function(){
            return Ext.create('Ext.XTemplate', '{[this.getPercent(values)]}', {
                getPercent: function(record) {
                    v = record._passRate;
                    if (v !== null && !isNaN(Number(v))){
                        return Math.round(v * 100) + '%';
                    }
                    return v || '--';
                }
            });
        },
        _plannedtestcases: function(){
            return Ext.create('Ext.XTemplate', '{[this.getPercent(values)]}', {
                getPercent: function(record) {
                    v = record._plannedTestCases;
                    if (v !== null && !isNaN(Number(v))){
                        return Math.round(v * 100) + '%';
                    }
                    return v || '--';
                }
            });
        },
        attributetype: function() {
            return Ext.create('Rally.ui.renderer.template.AttributeTypeTemplate');
        },

        blocked: function() {
            return Ext.create('Rally.ui.renderer.template.BlockedTemplate');
        },

        defects: function() {
            return Ext.create('Rally.ui.renderer.template.status.DefectStatusTemplate');
        },

        defectstatus: function() {
            return toTitleCaseFn('DefectStatus');
        },

        disabled: function() {
            return Ext.create('Rally.ui.renderer.template.BooleanTemplate', {
                fieldName: 'Disabled',
                alt: 'Disabled'
            });
        },

        discussion: function() {
            return Ext.create('Rally.ui.renderer.template.status.DiscussionStatusTemplate');
        },

        displaycolor: function() {
            return Ext.create('Rally.ui.renderer.template.DisplayColorTemplate');
        },

        formattedid: function(field, config) {
            return Ext.create('Rally.ui.renderer.template.FormattedIDTemplate', config);
        },

        hidden: function(field) {
            return Ext.create('Rally.ui.renderer.template.BooleanTemplate', {
                fieldName: 'Hidden',
                showCheckWhenTrue: false
            });
        },

        parent: function() {
            return Ext.create('Rally.ui.renderer.template.ParentTemplate');
        },

        percentdonebystorycount: function() {
            return Ext.create('Rally.ui.renderer.template.progressbar.PercentDoneByStoryCountTemplate');
        },

        percentdonebystoryplanestimate: function() {
            return Ext.create('Rally.ui.renderer.template.progressbar.PercentDoneByStoryPlanEstimateTemplate');
        },

        predecessorsandsuccessors: function() {
            return Ext.create('Rally.ui.renderer.template.status.PredecessorsAndSuccessorsStatusTemplate');
        },

        rank: function(field) {
            return Ext.create('Rally.ui.renderer.template.DecimalTemplate', {
                fieldName: field.name
            });
        },

        requirement: function(field) {
            return Ext.create('Rally.ui.renderer.template.ChildObjectFormattedIDTemplate', {
                childObjectProperty: 'Requirement',
                showName: true
            });
        },

        schedulestate: function(field){
            return Ext.create('Rally.ui.renderer.template.ScheduleStateTemplate', {
                field: field,
                showTrigger: true
            });
        },

        statechangeddate: function() {
            return Ext.create('Rally.ui.renderer.template.DaysInThisColumnTemplate');
        },

        tags: function() {
            return Ext.create('Rally.ui.renderer.template.PillTemplate', { collectionName: 'Tags', cls: 'rui-tag-list-item'});
        },

        milestones: function() {
            return Ext.create('Rally.ui.renderer.template.PillTemplate', { collectionName: 'Milestones', iconCls: 'icon-milestone', cls: 'milestone-pill'});
        },

        //TODO: Remove TaskActualTotalTemplate once backend supports TaskActualTotal on TestSet. DE23100
        taskactualtotal: function(){
            return Ext.create('Rally.ui.renderer.template.TaskActualTotalTemplate');
        },

        tasks: function() {
            return Ext.create('Rally.ui.renderer.template.status.TaskStatusTemplate');
        },

        taskstatus: function() {
            return toTitleCaseFn('TaskStatus');
        },

        testcase: function(field) {
            return Ext.create('Rally.ui.renderer.template.ChildObjectFormattedIDTemplate', {
                childObjectProperty: 'TestCase',
                showName: true
            });
        },

        testcases: function() {
            return Ext.create('Rally.ui.renderer.template.status.TestCaseStatusTemplate');
        },

        testcasestatus: function() {
            return toTitleCaseFn('TestCaseStatus');
        },

        testfolder: function(field) {
            return Ext.create('Rally.ui.renderer.template.ChildObjectFormattedIDTemplate', {
                childObjectProperty: 'TestFolder',
                showName: true
            });
        },

        visibilityonchildprojects: function(field) {
            return Ext.create('Rally.ui.renderer.template.VisibilityOnSubprojectsTemplate');
        },

        workproduct: function() {
            return Ext.create('Rally.ui.renderer.template.ChildObjectFormattedIDTemplate', {
                childObjectProperty: 'WorkProduct',
                showName: true
            });
        },

        targetproject: function () {
            return Ext.create('Ext.XTemplate', '{[this.getProjectName(values)]}', {
                getProjectName: function(record) {
                    return Rally.ui.MilestoneTargetProjectPermissionsHelper.getProjectName(record);
                }
            });
        }
    }

});

Ext.override(Ext.util.Filter,{
    createFilterFn: function() {
        var me       = this,
            matcher  = me.createValueMatcher(),
            property = !Ext.isArray(me.property) ? me.property.split(',') : me.property

        return function(item) {
            var hasmatch = false;
            for(var i=0;i<property.length;i++) {
                if(matcher.test(me.getRoot.call(me, item)[property[i]])) {
                    hasmatch=true;
                    break;
                }
            }
            return matcher === null ? value === null : hasmatch;
        };
    }
});


Ext.override(Rally.ui.combobox.ComboBox, {

    doLocalQuery: function(queryPlan) {
        var me = this,
            queryString = queryPlan.query;

        // Create our filter when first needed
        if (!me.queryFilter) {
            // Create the filter that we will use during typing to filter the Store
            me.queryFilter = new Ext.util.Filter({
                id: me.id + '-query-filter',
                anyMatch: true,
                caseSensitive: false,
                root: 'data',
                property: me.filterProperties
            });
            me.store.addFilter(me.queryFilter, true);
        }

        // Querying by a string...
        if (queryString || !queryPlan.forceAll) {
            me.queryFilter.disabled = false;
            me.queryFilter.setValue(me.enableRegEx ? new RegExp(queryString) : queryString);
        }

        // If forceAll being used, or no query string, disable the filter
        else {
            me.queryFilter.disabled = true;
        }

        // Filter the Store according to the updated filter
        me.store.filter();

        // Expand after adjusting the filter unless there are no matches
        if (me.store.getCount()) {
            me.expand();
        } else {
            me.collapse();
        }

        me.afterQuery(queryPlan);
    }
});
