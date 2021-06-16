(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('KnownPickupPoint', 'api/KnownPickupPoints', {
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
            Description: {
                type: String,
                textarea: 3
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
            Maplink: {
                type: String
            },
            KnownLocationId: {
                type: String
            },
            KnownLocation: {
                type: 'KnownLocation'
            },
            Bearing: {
                type: Number
            },
            Pitch: {
                type: Number
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
                        return window.endpoint + 'api/imagegen?text=' + (this.Name || '').replace(/ /g, "+");
                    }
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
            }
        });
    }
})(angular);