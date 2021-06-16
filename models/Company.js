(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Company', 'api/companies', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String
            },
            PricingModelId: {
                type: String,
                display: 'Default Pricing Model',
                displayField: '_PricingModelName',
                helpText: 'Default Pricing Model for when no client override is selected.',
            },
            PricingModel: {
                type: 'PricingModel'
            },
            LogoUrl: {
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
                type: String,
                display: 'Town/City'
            },
            County: {
                type: String
            },
            Postcode: {
                type: String
            },
            Country: {
                type: String
            },
            _FullAddress: {
                type: String,
                calculated: function() {
                    var summary = '';
                    summary += this.Address1 ? (this.Address1 + '\n') : '';
                    summary += this.Address2 ? (this.Address2 + '\n') : '';
                    summary += this.Area ? (this.Area + '\n') : '';
                    summary += this.TownCity ? (this.TownCity + '\n') : '';
                    summary += this.Postcode ? (this.Postcode + '\n') : '';
                    summary += this.County ? (this.County + '\n') : '';
                    summary += this.Country ? this.Country : '';
                    return summary;
                },
                display: 'Address'
            },
            BillingAddress1: {
                type: String
            },
            BillingAddress2: {
                type: String
            },
            BillingArea: {
                type: String
            },
            BillingTownCity: {
                type: String,
                display: 'Town/City'
            },
            BillingCounty: {
                type: String
            },
            BillingPostcode: {
                type: String
            },
            BillingCountry: {
                type: String
            },
            _FullBillingAddress: {
                type: String,
                calculated: function() {
                    var summary = '';
                    summary += this.BillingAddress1 ? (this.BillingAddress1 + '\n') : '';
                    summary += this.BillingAddress2 ? (this.BillingAddress2 + '\n') : '';
                    summary += this.BillingArea ? (this.BillingArea + '\n') : '';
                    summary += this.BillingTownCity ? (this.BillingTownCity + '\n') : '';
                    summary += this.BillingPostcode ? (this.BillingPostcode + '\n') : '';
                    summary += this.BillingCounty ? (this.BillingCounty + '\n') : '';
                    summary += this.BillingCountry ? this.BillingCountry : '';
                    return summary;
                },
                display: 'Billing Address'
            },
            Phone: {
                type: "Phone"
            },
            Mobile: {
                type: "Phone"
            },
            Fax: {
                type: "Phone"
            },
            Email: {
                type: String
            },
            Website: {
                type: String
            },
            BaseLatitude: {
                type: Number
            },
            BaseLongitude: {
                type: Number
            },
            BaseZoom: {
                type: Number
            },
            DispatchLatitude: {
                type: Number
            },
            DispatchLongitude: {
                type: Number
            },
            DispatchZoom: {
                type: Number
            },
            RoutingOption:{
                type: String,
                required: true,
                enum: ['SHORTEST','FASTEST']
            },
            UseSMTP: {
                type: Boolean
            },
            SMTPServer: {
                type: String
            },
            SMTPEmail: {
                type: String
            },
            SMTPUsername: {
                type: String
            },
            SMTPPassword: {
                type: String
            },
            SMTPPort: {
                type: Number
            },
            SMTPSecure: {
                type: Boolean
            },
            MailgunDomain: {
                type: String
            },
            MailgunKey: {
                type: String
            },
            MailgunFromEmail: {
                type: String
            },
            _PricingModelName: {
                type: String,
                calculated: function() {
                    return (this.PricingModel && this.PricingModel.Name);
                }
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function() {
                    if (this.LogoUrl) {
                        if (this.LogoUrl.slice(0, 4) == 'http') {
                            return this.LogoUrl;
                        } else {
                            return window.resourceEndpoint + this.LogoUrl;
                        }
                    } else {
                        return window.endpoint + 'api/imagegen?text=' + (this.Name || '').replace(/ /g, "+");
                    }
                }
            },
            DeactivateInvalidDrivers: {
                type: Boolean
            },
            DeactivateUnpayableDrivers: {
                type: Boolean
            },
            DefaultCurrencyId: {
                type: String,
                editable: false,
                display: 'Default Currency'
            },
            DefaultUserId: {
                type: String,
                display: 'Default User'
            },
            DefaultCurrency: {
                type: 'Currency',
                ref: 'Currency',
                refBy: 'DefaultCurrencyId'
            },
            DefaultLocale: {
                type: String,
                display: 'Locale'
            },
            DefaultTimezone: {
                type: String,
                display: 'Timezone'
            },
            UseMetric: {
                type: Boolean,
                defaultValue: false,
            },
            AutoCopyPassengerNotes: {
                type: Boolean,
                defaultValue: false,
            },
            ChauffeurModeActive: {
                type: Boolean
            },
            BankName: {
                type: String,
                display: "Bank Name"
            },
            RegistrationNumber: {
                type: String,
                display: "Registration Number"
            },
            VATNumber: {
                type: String,
                display: "VAT Number"
            },
            AccountNumber: {
                type: String,
                display: "Account Number"
            },
            SortCode: {
                type: String,
                display: "Sort Code"
            },
            IBAN: {
                type: String,
                display: "IBAN Number"
            },
            BIC: {
                type: String,
                display: "BIC Code"
            },
            DefaultInvoicePaymentInstructions: {
                type: String,
                textarea: 4,
                display: "Default Payment Advice"
            },
            DefaultInvoiceDueDateOffset: {
                type: Number,
                display: 'Default Payment Terms (Days)'
            },
            DefaultTaxId: {
                type: String,
                display: 'Default Tax',
                displayField: '_DefaultTax',
                required: true
            },
            DefaultTax: {
                type: 'Tax'
            },
            DefaultCardTaxId: {
                type: String,
                display: 'Default Tax (Card Bookings)',
                displayField: '_DefaultTax',
            },
            DefaultCardTax: {
                type: 'Tax'
            },
            DefaultCashTaxId: {
                type: String,
                display: 'Default Tax (Cash Bookings)',
                displayField: '_DefaultTax',
            },
            DefaultCashTax: {
                type: 'Tax'
            },
            ZonePickupCharge: {
                type: String,
                required: true
            },
            ZoneEntryCharge: {
                type: String,
                required: true
            },
            ZoneDropoffCharge: {
                type: String,
                required: true
            },
            DefaultDriverPaymentModelId: {
                type: String,
                displayField: 'DefaultDriverPaymentModel.Name',
                helpText: 'Default Driver Payment Model for when no override is selected.',
                table: {
                    hidden: true
                }
            },
            DefaultDriverPaymentModel: {
                type: 'DriverPaymentModel',
                ref: 'DriverPaymentModel',
                refBy: 'DefaultDriverPaymentModelId',
                table: {
                    hidden: true
                }
            },
            FlightTrackingAppId: {
                type: String,
                hidden: true
            },
            FlightTrackingAppKey: {
                type: String,
                hidden: true
            },
            RequiresClient: {
                type: Boolean,
                hidden: true,
                helpText: 'All Bookings require a Client to be selected'
            },
            RequiresBooker: {
                type: Boolean,
                hidden: true,
                helpText: 'All Bookings require a Booker to be selected when a Client is selected.'
            },
            RequiresContactNumber: {
                type: Boolean,
                hidden: true,
                helpText: 'All Bookings require a Contact Number'
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
            },
            OfferTimeout: {
                type: Number,
                min: 15,
                max: 60
            },
            CurrentCardPaymentProvider: {
                type: String,
                required: true,
                enum: ['None','Stripe','Judopay']
            },
            DefaultPax: {
                type: Number
            },
            DefaultBax: {
                type: Number
            },
            CallOnArrival: {
                type: Boolean,
                defaultValue: false
            },
            TextOnArrival: {
                type: Boolean,
                defaultValue: true
            },
            TextConfirmation: {
                type: Boolean,
                defaultValue: true
            },
            EmailConfirmation: {
                type: Boolean,
                defaultValue: true
            },

            TextAssigned: {
                type: Boolean,
                defaultValue: false
            },
            EmailAssigned: {
                type: Boolean,
                defaultValue: false
            },
            AutomatedWaitTimeCalculation:{
                type: Boolean,
                defaultValue: false
            },
            TextOnCompletion: {
                type: Boolean,
                defaultValue: true
            },
            TextOnOnRoute: {
                type: Boolean,
                defaultValue: false
            },
        });
    }
})(angular);