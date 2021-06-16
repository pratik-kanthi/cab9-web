(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Client', 'api/clients', {
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
            ClientTypeId: {
                type: String,
                required: true,
                displayField: 'ClientType.Name',
                table: {
                    hidden: true
                }
            },
            ClientType: {
                type: 'ClientType',
                ref: 'ClientType',
                refBy: 'ClientTypeId',
                table: {
                    hidden: true
                }
            },
            RoutingOption: {
                type: String
            },
            RepId: {
                type: String,
                displayField: 'Rep.Firstname',
                table: {
                    hidden: true
                }
            },
            Rep: {
                type: 'Staff',
                ref: 'Staff',
                refBy: 'RepId',
                table: {
                    hidden: true
                }
            },
            Priority: {
                type: String,
                required: true,
                enum: ['P1', 'P2', 'P3', 'P4', 'P5'],
                defaultValue: 'P3'
            },
            Name: {
                type: String,
                required: true
            },
            Address1: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Address2: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Area: {
                type: String,
                table: {
                    hidden: true
                }
            },
            DefaultPaymentType: {
                type: String,
                required: true,
                enum: ['Cash', 'Card', 'OnAccount', 'Other'],
                table: {
                    hidden: true
                }
            },
            AllowedPaymentTypes: {
                type: String,
                table: {
                    hidden: true
                }
            },
            TownCity: {
                type: String,
                display: 'Town/City',
                table: {
                    visible: false
                }
            },
            County: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Postcode: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Country: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Latitude: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            Longitude: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            AccountNo: {
                type: String
            },
            OnHold: {
                type: Boolean,
                binding: function(item) {
                    if (item.OnHold == true)
                        return 'Yes';
                    else if (item.OnHold == false)
                        return 'No';
                    else
                        return '';
                },
                table: {
                    visible: false
                }
            },
            AccountPassword: {
                type: String,
                table: {
                    hidden: true
                }
            },
            BannedDrivers: {
                type: ['Driver'],
                ref: 'Driver',
                refType: 'ManyToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            BillingLatitude: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            BillingLongitude: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            _FullAddress: {
                type: String,
                sort: ['Address1',
                    'Address2',
                    'Area',
                    'TownCity',
                    'Postcode',
                    'County',
                    'Country'
                ],
                reqColumns: ['Address1',
                    'Address2',
                    'Area',
                    'TownCity',
                    'Postcode',
                    'County',
                    'Country'
                ],
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
                table: {
                    visible: false
                },
                display: 'Full Address'
            },
            BillingAddress1: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Billing Address1'
            },
            BillingAddress2: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Billing Address2'
            },
            BillingArea: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Area'
            },
            BillingTownCity: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'TownCity'
            },
            BillingCounty: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'County'
            },
            BillingPostcode: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'PostCode'
            },
            BillingCountry: {
                type: String,
                table: {
                    hidden: true
                },
                display: 'Country'
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
                table: {
                    hidden: true
                },
                display: 'Full Billing Address'
            },
            PrimaryContact: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Phone: {
                type: "Phone"
            },
            Mobile: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            Fax: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            Email: {
                type: String,
                table: {
                    visible: false
                }
            },
            BillingContact: {
                type: String,
                table: {
                    visible: false
                }
            },
            BillingPhone: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            BillingMobile: {
                type: "Phone",
                table: {
                    hidden: true
                }
            },
            BillingFax: {
                type: "Phone",
                table: {
                    hidden: true
                }
            },
            BillingEmail: {
                type: String,
                table: {
                    hidden: true
                }
            },
            StartDate: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                defaultValue: new moment().toDate(),
                table: {
                    visible: false
                }
            },
            EndDate: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            Active: {
                type: Boolean,
                defaultValue: true,
                table: {
                    hidden: true
                }
            },
            ShowPriceInEmail: {
                type: Boolean,
                defaultValue: false,
                table: {
                    hidden: true
                }
            },
            AllowCashInPortal: {
                type: Boolean,
                defaultValue: false,
                table: {
                    hidden: true
                }
            },
            ShowPriceInPortal: {
                type: Boolean,
                defaultValue: false,
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Tags: {
                type: ['Tag'],
                ref: 'Tag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            ClientReferences: {
                type: ['ClientReference'],
                ref: 'ClientReference',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Passengers: {
                type: ['Passenger'],
                ref: 'Passenger',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            KnownLocations: {
                type: ['KnownLocation'],
                ref: 'KnownLocation',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                hidden: true
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function() {
                    if (this.ImageUrl) {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        var n = this.Name;
                        var spaceIndex = this.Name.indexOf(' ');
                        if (spaceIndex != -1) {
                            n = this.Name.substring(0, spaceIndex);
                        }
                        return window.endpoint + 'api/imagegen?text=' + n;
                    }
                }
            },
            ScoreOverall: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScoreBooking: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScoreRevenue: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            DefaultCurrencyId: {
                type: String,
                display: 'Default Currency',
                required: true,
                table: {
                    hidden: true
                }
            },
            DefaultCurrency: {
                type: 'Currency',
                ref: 'Currency',
                refBy: 'DefaultCurrencyId',
                table: {
                    hidden: true
                }
            },
            AutoInvoice: {
                type: Boolean,
                hidden: true
            },
            InvoicePeriod: {
                type: String,
                enum: ['Daily', 'Weekly', 'BiWeekly', 'Monthly'],
                hidden: true
            },
            InvoiceSplitField: {
                type: String,
                hidden: true
            },
            InvoiceGroupField: {
                type: String,
                hidden: true
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
            TextOnCompletion: {
                type: Boolean,
                defaultValue: true
            },
            TextOnOnRoute: {
                type: Boolean,
                defaultValue: false
            },
            TextAssigned: {
                type: Boolean,
                defaultValue: false
            },
            EmailAssigned: {
                type: Boolean,
                defaultValue: false
            },
            FreeWaitingTime: {
                type: Number
            },
            FreeWaitingTimeAirport: {
                type: Number
            },
            IsWaitingTimeGrace: {
                type: Boolean
            },
            IsWaitingTimeGraceAirport: {
                type: Boolean
            },
            PricingModelId: {
                type: String,
                display: 'Default Pricing Model',
                visible: false,
                table: {
                    hidden: true
                }
            },
            DefaultVehicleTypeId: {
                type: String,
                display: 'Default Vehicle Type',
                visible: false,
                table: {
                    hidden: true
                }
            },
            AllVehicleTypeAccess: {
                type: Boolean,
                table: {
                    hidden: true
                }
            },
            AutoDispatch: {
                type: Boolean,
                table: {
                    hidden: true
                }
            },
            VehicleTypes: {
                type: ['VehicleType'],
                ref: 'VehicleType',
                refType: 'ManyToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CancellationRuleId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            CancellationRule: {
                type: 'CancellationRule',
                ref: 'CancellationRule',
                refBy: 'CancellationRuleId',
                table: {
                    hidden: true
                }
            },
            SignatureRequired: {
                type: Boolean
            },
            ShowVATInPortal: {
                type: Boolean
            },
            DefaultTaxId: {
                type: String,
                display: 'Default Tax',
                visible: false,
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);
