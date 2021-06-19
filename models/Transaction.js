(function(angular) {
 var app = angular.module('cab9.models');
 app.config(appConfig);
 appConfig.$inject = ['ModelProvider'];

 function appConfig(ModelProvider) {
  ModelProvider.registerSchema('Transaction', 'api/Transactions', {
   Id: {
    type: String,
    editable: false
   },
   TenantId: {
    type: String
   },
   BookingId: {
    type: String
   },
   LocalId: {
    type: Number
   },
   CreatedAt: {
    type: moment,
    displayFilters: " | companyDate:'DD/MM/YYYY'"
   },
   Provider: {
    type: String
   },
   Success: {
    type: Boolean
   },
   Request: {
    type: String
   },
   Response: {
    type: String
   },
   PaymentCardId: {
    type: String
   },
   PaymentCardNumber: {
    type: String
   },
   PaymentCardType: {
    type: String
   },
   ClientName: {
    type: String
   },
   PassengerName: {
    type: String
   },
   InvoiceRef: {
    type: String
   },
   Amount: {
    type: Number
   },
   TransactionType: {
    type: String
   }
  });
 }
})(angular);