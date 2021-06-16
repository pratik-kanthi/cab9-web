(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverPaymentModelOverride', 'api/DriverPaymentModelOverrides', {
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
            VehicleTypeId: {
                type: String,
                displayField: 'VehicleType.Name',
                table: {
                    hidden: true
                }
            },
            PaymentType: {
                type: String
            },
            VehicleType: {
                type: 'VehicleType',
                ref: 'VehicleType',
                refBy: 'VehicleTypeId',
                table: {
                    hidden: true
                }
            },
            DriverPaymentModelId: {
                type: String,
                displayField: 'DriverPaymentModel.Name',
                table: {
                    hidden: true
                }
            },
            DriverPaymentModel: {
                type: 'DriverPaymentModel',
                ref: 'DriverPaymentModel',
                refBy: 'DriverPaymentModelId',
                table: {
                    hidden: true
                }
            },
            Type: {
                type: String,
                enum: ['Commission', 'Mileage'] //'Rent', 'PerBooking', 'PerHour',
            },

            CompanyCarCommision: {
                type: Number,
                min: -100,
                max: 100,
                display: 'Company Car Commission'
            },
            CompanyCarPerHour: {
                type: Number
            },
            CompanyCarPerBooking: {
                type: Number
            },
            CompanyCarPerMileSteps: {
                type: String
            },
            OwnCarCommision: {
                type: Number,
                min: -100,
                max: 100,
                display: 'Own Car Commission'
            },
            OwnCarPerHour: {
                type: Number
            },
            OwnCarPerBooking: {
                type: Number
            },
            OwnCarPerMileSteps: {
                type: String
            },
            ChauffeurCommision: {
                type: Number,
                min: 0,
                max: 100,
                display: 'Chauffeuring Commission'
            },
            ChauffeurPerHour: {
                type: Number,
                min: 0,
                display: 'Chauffeuring Per Hour'
            },
            WaitingPerHour: {
                type: Number
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
        });
    }
})(angular);