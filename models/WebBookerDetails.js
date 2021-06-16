(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('WebBookerDetails', '', {
            _id: {
                type: String,
                required: true
            },
            Name: {
                type: String,
                required: true
            },
            TenantId: {
                type: String,
                required: true
            },
            Template: {
                type: String,
                ref: 'Template'
            },
            SecretKey: {
                type: String,
                inputType: 'password'
            },
            StaffUserName: {
                type: String,
                required: true
            },
            StaffPassword: {
                type: String,
                required: true
            },
            DefaultClientId: {
                type: String,
                required: true
            },
            DefaultBookerId: {
                type: String,
                required: true
            },
            RefererUrl: {
                type: String,
                required: true
            },
            CoverageAreas: [
                String
            ],
            Restrictions: {
                type: 'WebBookerRestrictions'
            },
            BrandColors: {
                type: 'WebBookerBrandColors'
            },
            TemplateText: {
                type: 'WebBookerTemplateText'
            },
            DefaultPickup: {
                type: 'WebBookerStops'
            },
            ExternalScripts: {
                type: 'WebBookerExternalScripts'
            },
            NearbyDropOffs: ['WebBookerStops'],
            ContactInfo: ['ContactInfo']
        });

        ModelProvider.registerSchema('ContactInfo', '', {
            Email: {
                type: String
            },
            PhoneNumber: {
                type: String
            },
            Website: {
                type: String
            }
        })
        ModelProvider.registerSchema('WebBookerStops', '', {
            StopSummary: {
                type: String
            },
            Address1: {
                type: String
            },
            Address2: {
                type: String
            },
            Area: {
                type: String
            },
            TownCity: {
                type: String
            },
            Postcode: {
                type: String
            },
            County: {
                type: String
            },
            Country: {
                type: String
            },
            Latitude: {
                type: String
            },
            Longitude: {
                type: String
            }
        })
        ModelProvider.registerSchema('Template', '', {
            Name: {
                type: String
            },
            TemplateUrl: {
                type: String
            },
        });
        ModelProvider.registerSchema('WebBookerRestrictions', '', {
            Mileage: {
                type: Number
            },
            LeadTime: {
                type: Number
            },
            AllowCash: {
                type: Boolean
            },
            SMS: {
                type: Boolean
            },
            Email: {
                type: Boolean
            }
        });
        ModelProvider.registerSchema('WebBookerBrandColors', '', {
            Primary: {
                type: String,
                required: true
            },
            Secondary: {
                type: String,
                required: true
            },
            Light: {
                type: String,
                required: true
            },
            Dark: {
                type: String,
                required: true
            },
            Grey: {
                type: String,
                required: true
            }
        });
        ModelProvider.registerSchema('WebBookerTemplateText', '', {
            CoverageAreasText: {
                type: String,
                textarea: 4
            },
            MileageText: {
                type: String,
                textarea: 4
            },
            LeadTimeText: {
                type: String,
                textarea: 4
            },
            CashPaymentText: {
                type: String,
                textarea: 4
            },
            BookingConfirmationAlertText: {
                type: String,
                textarea: 4
            },
            EmailText: {
                type: String,
                textarea: 4
            },
            SMSText: {
                type: String,
                textarea: 4
            }
        });

        ModelProvider.registerSchema('WebBookerExternalScripts', '', {
            HeaderJS: {
                type: String,
                textarea: 4
            },
            BodyJS: {
                type: String,
                textarea: 4
            },
            FooterJS: {
                type: String,
                textarea: 4
            }
        });
    }
})(angular);
