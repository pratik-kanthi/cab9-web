(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('KnownLocation', 'api/KnownLocations', {
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
            LocationType: {
                type: String,
                enum: ["STATION", "AIRPORT", "OFFICE", "OTHER"]
            },
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
            County: {
                type: String
            },
            Postcode: {
                type: String
            },
            Country: {
                type: String
            },
            Latitude: {
                type: Number
            },
            Longitude: {
                type: Number
            },
            ImageUrl: {
                type: String
            },
            KnownPickupPoints: {
                type: ['KnownPickupPoint'],
                table:{
                    hidden:true
                }
            },
            _KnownPickupPoints: {
                sort:['Id'],
                reqColumns: ['KnownPickupPoints/Id'],
                calculated: function() {
                    return this.KnownPickupPoints && this.KnownPickupPoints.length;
                },
                display:'KnownPickupPoints'
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
                        if (this.Latitude && this.Longitude) {
                            var k = "AIzaSyAtRDZdVGx8r7tFPZR7h2D95VwsSyGqz-0";
                            return "https://maps.googleapis.com/maps/api/staticmap?center=" + this.Latitude + "," + this.Longitude + "&zoom=18&size=400x400&key=" + k;
                        } else {
                            return window.endpoint + 'api/imagegen?text=' + (this.Name || '').replace(/ /g, "+");
                        }
                    }
                }
            }
        });
    }
})(angular);