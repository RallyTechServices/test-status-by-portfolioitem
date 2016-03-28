Ext.define('Rally.technicalservices.ModelExtender',{
    singleton: true,

    build: function(model) {
        var default_fields = [{
            name: '_totalTestCases',
            defaultValue: null,
            displayName: 'Total'
        },{
            name: '_actualTestCases',
            displayName: 'Actual',
            defaultValue: null
        },{
            name: '_plannedTestCases',
            displayName: 'Planned',
            defaultValue: null
        },{
            name: '_passRate',
            displayName: 'Passed',
            defaultValue: null
        }, {
            name: '_testCaseStatus',
            displayName: 'Status',
            defaultValue: null
        }];

        _.each(default_fields, function(df){
            model.addField(df);
        });
        model.addMembers({
            calculate: function(testCases) {

                this.set('_totalTestCases', testCases.length);
                this.set('_actualTestCases', this._getActual(testCases));
                this.set('_plannedTestCases', this._getPlan(testCases));
                this.set('_passRate', this._getPassRate(testCases));
                this.set('_testCaseStatus', this._getStatus(testCases));
            },
            _getActual: function(testCases){
                if (testCases.length > 0){
                    return this._getTestCasesRun(testCases)/testCases.length;
                }
                return 0;
            },
            _getPlan: function(testCases){
                var today = new Date(),
                    startDate = this.get('PlannedStartDate') || this.get('ActualStartDate') || null,
                    endDate = this.get('PlannedEndDate') || this.get('ActualEndDate') || null;
                console.log('_plan', this,startDate, endDate);
                if (startDate && endDate){
                    if (endDate < startDate){
                        var tmp = endDate;
                        endDate = startDate;
                        startDate = tmp;
                    }

                    var totalRange = Rally.util.DateTime.getDifference(endDate, startDate, 'hour'),
                        currentRange = Rally.util.DateTime.getDifference(today, startDate, 'hour');

                    if (today >= startDate && today <= endDate){
                        return totalRange > 0 ? currentRange/totalRange : 0;
                    }

                    if (today > endDate){
                        return 1;
                    }
                    //if none of the above, then today is < start date and planned = 0
                }
                return 0;
            },
            _getTestCasesRun: function(testCases){
                var run = 0;
                _.each(testCases, function(tc){
                    if (tc.get('LastRun')){
                        run++;
                    }
                });
                return run;
            },
            _getPassRate: function(testCases){
                var passed = 0,
                    passVerdicts = ['Pass'],
                    total = testCases.length;

                _.each(testCases, function(tc){
                    if (Ext.Array.contains(passVerdicts, tc.get('LastVerdict'))){
                        passed++;
                    }
                });

                if (total > 0){
                    return passed/total;
                }
                return 0;
            },
            _getStatus: function(testCases){
                // "NONE", "NONE_RUN", "SOME_RUN_SOME_NOT_PASSING", "SOME_RUN_ALL_PASSING", "ALL_RUN_NONE_PASSING", "ALL_RUN_ALL_PASSING"

                var run = 0,
                    passed = 0,
                    total = testCases.length;

                _.each(testCases, function(tc){
                    if (tc.get('LastRun')){
                        run++;
                    }
                    if (tc.get('LastVerdict') === "Pass"){
                        passed++;
                    }
                });

                if (testCases.length === 0) {
                    return "NONE";
                }
                if (run === 0){
                    return "NONE_RUN";
                }
                if (passed > 0){
                    if (run === passed){
                        if (run === total){
                            return "ALL_RUN_ALL_PASSING";
                        }
                        return "SOME_RUN_ALL_PASSING";
                    }
                    if (run === total){
                        return "ALL_RUN_SOME_NOT_PASSING";
                    }
                    return "SOME_RUN_SOME_NOT_PASSING";
                }

                if (run === total){
                    return "ALL_RUN_NONE_PASSING";
                }
                return "SOME_RUN_NONE_PASSING";
            }
        });
    }
});