(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PartnerVehicle', '', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            Partner: {
                type: 'Partner',
                ref: 'Partner',
                refBy: 'PartnerId',
                table: {
                    hidden: true
                }
            },
            PartnerId:{
                type: String,
                editable: false,
            },
            Make: {
                type: String
            },
            Model: {
                type: String
            },
            Colour: {
                type: String
            },
            Reg: {
                type: String
            },
            _Description: {
                type: String,
                calculated: function() {
                    return ('(' + this.Reg + ') ' + this.Colour + ' ' + this.Make + ' ' + this.Model);
                },
                display: 'Description'
            },
        });
    }
})(angular);