 (function(angular) {
     var app = angular.module('cab9.models');
     app.config(appConfig);
     appConfig.$inject = ['ModelProvider'];

     function appConfig(ModelProvider) {
         ModelProvider.registerSchema('NotificationTemplates', 'api/NotificationTemplates', {
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
             NewBookingOfferTitle: {
                 type: String,
                 display: 'Title',
                 required: true
             },
             NewBookingOfferText: {
                 type: String,
                 display: 'Template',
                 required: true
             },
             ShiftTimeoutAlertTitle: {
                 display: 'Title',
                 type: String,
                 required: true
             },
             ShiftTimeoutAlertText: {
                 display: 'Template',
                 type: String,
                 required: true
             },
             ShiftTimeoutFinalAlertTitle: {
                 display: 'Title',
                 type: String,
                 required: true
             },
             ShiftTimeoutFinalAlertText: {
                 display: 'Template',
                 type: String,
                 required: true
             },
             ShiftClosedAlertTitle: {
                 display: 'Title',
                 type: String,
                 required: true
             },
             ShiftClosedAlertText: {
                 display: 'Template',
                 type: String,
                 required: true
             },
             NewBookingTitle: {
                 display: 'Title',
                 type: String,
                 required: true
             },
             NewBookingText: {
                 display: 'Template',
                 type: String,
                 required: true
             },
             BookingChangedTitle: {
                 display: 'Title',
                 type: String,
                 required: true
             },
             BookingChangedText: {
                 display: 'Template',
                 type: String,
                 required: true
             },
             BookingUnallocatedTitle: {
                 display: 'Title',
                 type: String,
                 required: true
             },
             BookingUnallocatedText: {
                 display: 'Template',
                 type: String,
                 required: true
             },
             BookingOnRouteTitle: {
                display: 'Title',
                type: String,
                required: true
            },
            BookingOnRouteText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingCancelledTitle: {
                display: 'Title',
                type: String,
                required: true
            },
            BookingCancelledText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingArrivedTitle : {
                display: 'Title',
                type: String,
                required: true
            },
            BookingArrivedText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingInProgressTitle: {
                display: 'Title',
                type: String,
                required: true
            },
            BookingInProgressText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingCOATitle: {
                display: 'Title',
                type: String,
                required: true
            },
            BookingCOAText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingCompletedTitle: {
                display: 'Title',
                type: String,
                required: true
            },
            BookingCompletedText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingAllocatedForPassengerTitle : {
                display: 'Title',
                type: String,
                required: true
            },
            BookingAllocatedForPassengerText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingUnallocatedForPassengerTitle: {
                display: 'Title',
                type: String,
                required: true
            },
            BookingUnallocatedForPassengerText: {
                display: 'Template',
                type: String,
                required: true
            },
            BookingNextStopForPassengerTitle: {
                display: 'Title',
                type: String,
                required: true
            },
            BookingNextStopForPassengerText: {
                display: 'Template',
                type: String,
                required: true
            }
        });
     }
 })(angular);