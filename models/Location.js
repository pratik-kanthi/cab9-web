(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Location', 'api/Locations', {
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
            Type: {
                type: String
            },
            Latitude: {
                type: Number,
                required: false
            },
            Postcode: {
                type: String,
                required: false
            },
            Longitude: {
                type: Number,
                required: false
            },
            Searchable: {
                type: String
            },
            Note: {
                type: String
            },
            ICAO: {
                type: String
            },
            Code: {
                type: String
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