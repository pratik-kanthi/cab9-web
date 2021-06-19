(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('AutoAllocationRule', '', {
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
                required: false,
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
                required: false,
                displayField: 'VehicleType.Name',
                table: {
                    hidden: true
                }
            },
            VehicleType: {
                type: 'VehicleType',
                ref: 'VehicleType',
                refBy: 'VehicleTypeId',
                table: {
                    hidden: true
                }
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
            DriverIdentifier: {
                type: String,
            },
            MaxMileage: {
                type: Number
            },
            MinMileage: {
                type: Number
            },
            StartPeriod: {
                type: Number,
                required:true
            },
            EndPeriod: {
                type: Number,
                required:true
            },
            CreationTime: {
                type: moment,
                hidden: true
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
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);