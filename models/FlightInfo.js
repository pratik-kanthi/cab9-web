(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('FlightInfo', 'api/flightinfo', {
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
            Arrival: {
                type: Boolean,
                defaultValue: true,
            },
            AlertString: {
                type: String
            },
            FlightNumber: {
                type: String
            },
            OriginCode: {
                type: String
            },
            Origin: {
                type: String
            },
            DestinationCode: {
                type: String
            },
            Destination: {
                type: String
            },
            Terminal: {
                type: String
            },
            SuggestedAddressId: {
                type: String
            },
            SuggestedAddress: {
                type: Object
            },
            FlightData: {
                type: String
            },
            ScheduledArrivalTime: {
                type: moment,
                display: 'Arrival Time',
                displayFilters: " | companyDate:'HH:MM'"
            },
            ArrivalTime: {
                type: moment,
                display: 'Arrival Time',
                displayFilters: " | companyDate:'HH:MM'"
            },
            Status: {
                type: String
            },
            MinsAfterLanding: {
                type: Number,
                minValue: 0,
                maxValue: 180,
                defaultValue: 0,
                inputType: 'number',
                step: 5
            },
            Notes: {
                type: String
            },
            LastUpdate: {
                type: moment,
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);
