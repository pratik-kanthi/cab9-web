 (function(angular) {
     var app = angular.module('cab9.models');
     app.config(appConfig);
     appConfig.$inject = ['ModelProvider'];

     function appConfig(ModelProvider) {
         ModelProvider.registerSchema('ClientWebBookerSetting', 'api/ClientWebBookerSettings', {
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
             WebBookingDomain: {
                 type: String,
                 required: true,
                 display: 'Web Booking Domain'
             },
             WelcomeMessage: {
                 type: String,
                 display: 'Welcome Message'
             },
             WelcomeDescription: {
                 type: String,
                 display: 'Welcome Description'
             },
             WelcomeHeroImage: {
                 type: String,
                 display: 'Welcome Image'
             },
             _WelcomeHeroImage: {
                 type: String,
                 hidden: true,
                 calculated: function () {
                     if (this.WelcomeHeroImage) {
                         if (this.WelcomeHeroImage.slice(0, 4) == 'http') {
                             return this.WelcomeHeroImage;
                         } else {
                             return $config.RESOURCE_ENDPOINT + this.WelcomeHeroImage;
                         }
                     }
                     //else {
                     //    var n = this.Client.Name;
                     //    var spaceIndex = this.Client.Name.indexOf(' ');
                     //    if (spaceIndex != -1) {
                     //        n = this.Client.Name.substring(0, spaceIndex);
                     //    }
                     //    return $config.API_ENDPOINT + 'api/imagegen?text=' + n;
                     //}
                 }
             },
             ModificationUserId: {
                 type: String
             },
             CreationUserId: {
                 type: String
             },
             ModificationTime: {
                 type: moment,
                 display: 'Modification Time'
             },
         });
     }
 })(angular);