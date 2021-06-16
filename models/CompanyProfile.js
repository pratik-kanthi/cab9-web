(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('CompanyProfile', 'api/CompanyProfiles', {
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
            Name: {
                type: String
            },
            CompanyDescription: {
                type: String,
                textarea: 6,
                required: true
            },
            PrimaryContactName: {
                type: String,
                required: true
            },
            PrimaryContactEmail: {
                type: String,
                required: true
            },
            PricingModelName: {
                type: String
            },
            PrimaryContactPhone: {
                type: "Phone",
                required: true
            },
            ServiceManagerName: {
                type: String,
                required: true
            },
            ServiceManagerEmail: {
                type: String,
                required: true
            },
            ServiceManagerPhone: {
                type: "Phone",
                required: true
            },
            AccountManagerName: {
                type: String
            },
            AccountManagerEmail: {
                type: String
            },
            AccountManagerPhone: {
                type: "Phone"
            },
            OperatorLicenseNumber: {
                type: String,
                required: true
            },
            LogoUrl: {
                type: String,
                required: true
            },
            Website: {
                type: String,
                required: true
            },
            OperatorLicenseExpiryDate: {
                type: moment,
                required: true,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            OperatorYearEstablished: {
                type: Number
            },
            OperatorFinancialYear: {
                type: String
            },
            RejectReason: {
                type: String
            },
            OperatorLicensingAuthority: {
                type: String,
                required: true
            },
            AlreadyPartner: {
                type: Boolean
            },
            ShowLiveDrivers: {
                type: Boolean
            },
            ShowLiveDriversUpdateTime: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY HH:mm'",
                table: {
                    visible: false
                }
            },
            PartnerRequestId: {
                type: String,
                editable: false,
                hidden: true
            },
            PartnerRequestStatus: {
                type: String,
                enum: ["Requested", "Rejected", "Accepted"]
            },
            RequestId: {
                type: String,
                editable: false,
                hidden: true
            },
            RequestStatus: {
                type: String,
                enum: ["Requested", "Rejected", "Accepted"]
            },
            OperatorAccountFillingDate: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            FacebookLink: {
                type: String
            },
            TwitterLink: {
                type: String
            },
            LinkedInLink: {
                type: String
            },
            PricingModelId: {
                type: String,
                required: true,
                displayField: 'PricingModel.Name',
                table: {
                    hidden: true
                }
            },
            PricingModel: {
                type: 'PricingModel',
                ref: 'PricingModel',
                refBy: 'PricingModelId',
                table: {
                    hidden: true
                }
            },
            VehicleTypes: {
                type: ['VehicleType'],
                ref: 'VehicleType',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            CoverageArea: {
                type: String,
                required: true
            },
            DriversCount: {
                type: Number
            },
            VehiclesCount: {
                type: Number
            },
            BookingsCount: {
                type: Number
            },
            PartnerBookingsCount: {
                type: Number
            },
            AllowedServices: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
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