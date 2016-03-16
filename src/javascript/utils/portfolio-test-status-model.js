Ext.define('Rally.technicalservices.PortfolioTestStatusRow',{
    constructor: function(config) {
        this.portfolioItem = config.portfolioItem;
        this.testCases = config.testCases;
    },
    getDataRow: function(){
        return {
            drop: 'drop',
            subject: this.portfolioItem.get('Name'),
            actual: this._getActual(),
            plan: this._getPlan(),
            passRate: this._getPassRate(),
            total: this.testCases.length,
            certificationDate: this.portfolioItem.get('PlannedEndDate'),
            comments: this._getComments(),

        };
    },
    _getActual: function(){
        if (this.testCases.length > 0){
            console.log('_etActual',this._getTestCasesRun(), this.testCases.length);
            return this._getTestCasesRun()/this.testCases.length;
        }
        return 0;
    },
    _getPlan: function(){
        var today = new Date(),
            startDate = this.portfolioItem.get('PlannedStartDate') || this.portfolioItem.get('ActualStartDate') || null,
            endDate = this.portfolioItem.get('PlannedEndDate') || this.portfolioItem.get('ActualEndDate') || null;

        if (startDate && endDate){
            if (endDate < startDate){
                var tmp = endDate;
                endDate = startDate;
                startDate = tmp;
            }
            console.log('_getPlan', endDate, startDate
            );
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
    _getTestCasesRun: function(){
        var run = 0;
        _.each(this.testCases, function(tc){
            if (tc.get('LastRun')){
                run++;
            }
        });
        return run;
    },
    _getPassRate: function(){
        var passed = 0,
            passVerdicts = ['Pass'],
            total = this.testCases.length;

        _.each(this.testCases, function(tc){
            if (Ext.Array.contains(passVerdicts, tc.get('LastVerdict'))){
                passed++;
            }
        });

        if (total > 0){
            return passed/total;
        }
        return 0;
    },
    _getCertificationDate: function(){
        return 'certification Date';
    },
    _getComments: function(){
        return 'comments';
    }
});
