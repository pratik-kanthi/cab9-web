(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PaymentCard', 'api/PaymentCards', {
            Id: {
                type: String,
                editable: false,
            },
            CardNumber: {
                type: String
            },
            ExpirationMonth: {
                type: Number,
                required: true
            },
            ExpirationYear: {
                type: Number,
                required: true
            },
            Cvc: {
                type: Number,
                required: true
            },
            ClientId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                table: {
                    hidden: true
                }
            },
            PassengerId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Passenger: {
                type: 'Passenger',
                table: {
                    hidden: true
                }
            },
            DriverId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                table: {
                    hidden: true
                }
            },
            BillingName: {
                type: String
            },
            BillingAddress: {
                type: String
            },
            BillingPostcode: {
                type: String
            },
            DefaultCard: {
                type: Boolean
            },
            Type: {
                type: String
            },
            PlatformType:{
                type: String,
                required: true,
                enum: ['None','Stripe','Judopay']
            }
        });
    }
})(angular);
