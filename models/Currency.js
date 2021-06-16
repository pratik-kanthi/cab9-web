 (function(angular) {
     var app = angular.module('cab9.models');
     app.config(appConfig);
     appConfig.$inject = ['ModelProvider'];

     function appConfig(ModelProvider) {
         ModelProvider.registerSchema('Currency', 'api/Currencies', {
             Id: {
                 type: String,
                 editable: false,
                 hidden: true
             },
             Name: {
                 type: String,
             },
             Short: {
                 type: String,
             },
             Prepend: {
                 type: String
             },
             Append: {
                 type: String
             },
             CurrentRate: {
                 type: Number
             },
             CreationTime: {
                 type: moment,
                 display: 'Creation Time',
                 table: {
                     hidden: true
                 }
             },
             ModificationUserId: {
                 type: String,
                 table: {
                     hidden: true
                 }
             },
             CreationUserId: {
                 type: String,
                 table: {
                     hidden: true
                 }
             },
             ModificationTime: {
                 type: moment,
                 display: 'Modification Time',
                 table: {
                     hidden: true
                 }
             }
         });
     }
 })(angular);