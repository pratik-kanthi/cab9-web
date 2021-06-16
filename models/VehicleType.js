(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('VehicleType', 'api/vehicletypes', {
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
                type: String,
                required: true
            },
            ClientLabel: {
                type: String
            },
            DriverLabel: {
                type: String
            },
            Description: {
                type: String
            },
            MaxPax: {
                type: Number,
                display: 'Maximum Passengers Allowed',
                required: true
            },
            MaxBax: {
                type: Number,
                display: 'Maximum Bags Allowed',
                required: true
            },
            ImageUrl: {
                type: String,
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
                    }
                }
            },
            IsDefault: {
                type: Boolean,
            },
            AppBookable: {
                type: Boolean,
                display: 'Is App Bookable?'
            },
            OTMapping: {
                type: String,
                display: 'One Transport Mapping'
            },
            CFMapping: {
                type: String,
                display: 'City Fleet Mapping'
            },
            GSMapping: {
                type: String,
                display: 'Groundscope Mapping'
            },
            InfinityMapping: {
                type: String,
                Display: 'Infinity Mapping'
            },
            HEREMapsMapping: {
                type: String,
                Display: 'Here Maps Mapping'
            },
            GettMapping: {
                type: String,
                Display: 'Gett Mapping'
            },
            Vehicles: {
                type: ['Vehicle'],
                ref: 'Vehicle',
                refType: 'OneToMany',
                defaultValue: [],
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
            Priority: {
                type: Number
            },
            Order: {
                type: Number
            }, 
            Colour: {
                type: String
            }, 
            TaxId: {
                type: String,
                displayField: 'Type.Name',
                table: {
                    hidden: true
                }
            },
            Tax: {
                type: 'Tax',
                ref: 'Tax',
                refBy: 'TaxId',
                table: {
                    hidden: true
                }
            },
        });
    }
})(angular);