(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Driver', 'api/drivers', {
            Id: {
                type: String,
                editable: false,
                required: true,
                validators: [],
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            DriverTypeId: {
                type: String,
                required: true,
                displayField: 'DriverType.Name',
                table: {
                    hidden: true
                }
            },
            DriverType: {
                type: 'DriverType',
                ref: 'DriverType',
                refBy: 'DriverTypeId',
                table: {
                    hidden: true
                }
            },
            Firstname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Surname: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            DriverStatus: {
                type: String,
                enum: ["Offline", "OnBreak", "OnJob", "Clearing", "Available"],
                table: {
                    visible: false
                }
            },
            _Fullname: {
                type: String,
                sort: ['Firstname', 'Surname'],
                reqColumns: ['Firstname', 'Surname'],
                calculated: function() {
                    return (this.Firstname + ' ' + this.Surname);
                },
                display: 'Full Name'
            },
            Callsign: {
                type: String,
                required: true
            },
            Nationality: {
                type: String,
                table: {
                    visible: false
                }
            },
            SupplierNo: {
                type: String,
                table: {
                    visible: false
                }
            },
            DateOfBirth: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
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
            _FullAddress: {
                type: String,
                sort: ['Address1', 'Address2', 'Area', 'TownCity', 'Postcode', 'County', 'Country'],
                reqColumns: ['Address1', 'Address2', 'Area', 'TownCity', 'Postcode', 'County', 'Country'],
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
            Phone: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            Mobile: {
                type: "Phone",
            },
            Fax: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            CurrentBookingId: {
                type: "CurrentBookingId",
                table: {
                    hidden: true
                }
            },
            CurrentVehicleId: {
                type: "CurrentVehicleId",
                table: {
                    hidden: true
                }
            },
            CurrentVehicle: {
                type: 'Vehicle',
                ref: 'CurrentVehicle',
                refBy: 'CurrentVehicleId',
                table: {
                    hidden: true
                }
            },
            Email: {
                type: String
            },
            NationalInsurance: {
                type: String,
                table: {
                    visible: false
                }
            },
            BankName: {
                type: String,
                table: {
                    visible: false
                }
            },
            BankAC: {
                type: String,
                table: {
                    visible: false
                }
            },
            BankSortCode: {
                type: String,
                table: {
                    visible: false
                }
            },
            MinimumInvoiceAmount: {
                type: Number,
                table: {
                    visible: false
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
                required: false,
                table: {
                    visible: false
                }
            },
            VATRegistered: {
                type: Boolean,
                display: 'VAT Registered',
                defaultValue: true,
                table: {
                    hidden: true
                }
            },
            VATNumber: {
                type: String,
                display: 'VAT Number',
                table: {
                    hidden: true
                }
            },
            Active: {
                type: Boolean,
                defaultValue: true
            },
            VIP: {
                type: Boolean,
                defaultValue: false
            },
            InactiveReason: {
                type: String,
                table: {
                    hidden: true
                }
            },
            SubContractor: {
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
            CreationTime: {
                type: moment,
                hidden: true
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    if (this.ImageUrl) {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        return window.endpoint + 'api/imagegen?text=' + (this.Callsign || '').replace(/ /g, "+");
                    }
                }
            },
            DefaultDriverPaymentModelId: {
                type: String,
                displayField: 'DefaultDriverPaymentModel.Name',
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
            ScoreShift: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScoreAcceptance: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ScorePassenger: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            LastKnownLatitude: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            LastKnownLongitude: {
                type: Number,
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
            Cards: {
                type: ['PaymentCard'],
                binding: function(item) {
                    if(item.Cards && item.Cards.length > 0) {
                        return item.Cards[0].CardNumber;
                    } else {
                        return 'Not Added';
                    }
                },
                table: {
                    visible: false
                }
            },
            AutoDispatch: {
                type: Boolean,
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);