(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Vehicle', 'api/vehicles', {
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
            VehicleClassId: {
                type: String,
                required: true,
                displayField: 'Class.Name',
                table: {
                    hidden: true
                }
            },
            Class: {
                type: 'VehicleClass',
                ref: 'VehicleClass',
                refBy: 'VehicleClassId',
                table: {
                    hidden: true
                }
            },
            VehicleTypeId: {
                type: String,
                required: true,
                displayField: 'Type.Name',
                table: {
                    hidden: true
                }
            },
            Type: {
                type: 'VehicleType',
                ref: 'VehicleType',
                refBy: 'VehicleTypeId',
                table: {
                    hidden: true
                }
            },
            Make: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            Model: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            Colour: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            RegYear: {
                type: String,
                required: true,
                table: {
                    visible: false
                }
            },
            CORating: {
                type: Number,
                table: {
                    visible: false
                }
            },
            _Description: {
                type: String,
                sort: ['Colour', 'Make', 'Model'],
                reqColumns: ['Colour', 'Make', 'Model'],
                calculated: function() {
                    return (this.Colour + ' ' + this.Make + ' ' + this.Model);
                },
                display: 'Description'
            },
            Registration: {
                type: String,
                required: true,
                display: 'Registration No.'
            },
            Description: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Pax: {
                type: Number,
                defaultValue: 4,
                table: {
                    hidden: true
                },
                display: 'Max. Passengers'
            },
            Bax: {
                type: Number,
                defaultValue: 1,
                table: {
                    hidden: true
                },
                display: 'Max. Baggage'
            },
            Wheelchairs: {
                type: Number,
                defaultValue: 0,
                table: {
                    hidden: true
                },
                display: 'Max. Wheelchairs'
            },
            Electric: {
                type: Boolean,
                binding: function(item) {
                    if (item.Electric == true)
                        return 'Yes';
                    else if (item.Electric == false)
                        return 'No';
                    else
                        return '';
                }
            },
            StartDate: {
                type: moment,
                required: false,
                defaultValue: new moment().toDate(),
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            EndDate: {
                type: moment,
                required: false,
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
            IsCompanyVehicle: {
                type: Boolean,
                binding: function(item) {
                    if (item.IsCompanyVehicle == true)
                        return 'Yes';
                    else if (item.IsCompanyVehicle == false)
                        return 'No';
                    else
                        return '';
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            DriverId: {
                type: String,
                displayField: 'Driver._Fullname',
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
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
                calculated: function() {
                    return $config.API_ENDPOINT + 'api/imagegen?type=plate&text=' + (this.Registration || '').replace(/ /g, "+");
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