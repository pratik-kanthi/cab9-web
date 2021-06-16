 (function(angular) {
     var app = angular.module('cab9.models');
     app.config(appConfig);
     appConfig.$inject = ['ModelProvider'];

     function appConfig(ModelProvider) {
         ModelProvider.registerSchema('ClientReference', 'api/clientreferences', {
             Id: {
                 type: String,
                 editable: false,
                 hidden: true
             },
             TenantId: {
                 type: String,
                 editable: false,
                 hidden: true
             },
             ClientId: {
                 type: String,
                 displayField: 'Client.Name',
                 table: {
                     hidden: true
                 }
             },
             Client: {
                 type: 'Client',
                 ref: 'Client',
                 refBy: 'ClientId',
                 table: {
                     hidden: true
                 }
             },
             ReferenceName: {
                 type: String,
                 required: true
             },
             Mandatory: {
                 type: Boolean
             },
             AllowAddToList: {
                 type: Boolean
             },
             ShowList: {
                 type: Boolean
             },
             ReferenceType: {
                 type: String,
                 enum: ['List', 'FreeText', 'Mask'],
                 binding: function (item) {
                     if (item.ReferenceType == 'Mask' && item.Value) {
                         return 'Mask - ' + item.Value;
                     } else {
                         return item.ReferenceType;
                     }
                 }
             },
             Value: {
                 type: String,
                 hidden: true,
                 binding: function (item) {
                     if (item.ReferenceType == 'List' && item.Value) {
                         var index = item.Value.lastIndexOf('/');
                         return item.Value.substring(index + 1);
                     } else {
                         return item.Value;
                     }
                 }
             },
             Active: {
                 type: Boolean,
                 defaultValue: true
             },
             _KnownValuesCSVUrl: {
                 type: String,
                 hidden: true,
                 calculated: function() {
                     if (this.Value) {
                         return $config.RESOURCE_ENDPOINT + this.TenantId + "/" + this.Value;
                     }
                 }
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
         })
     }
 })(angular);