(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PartnerDriver', '', {
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
            PartnerId: {
                type: String,
                editable: false,
            },
            Name: {
                type: String
            },
            ImageUrl: {
                type: String
            },
            Mobile: {
                type: String
            },
            Compliance: {
                type: String
            },
            LastKnownLatitude: {
                type: Number
            },
            LastKnownLongitude: {
                type: Number
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    return window.formatImage(this.ImageUrl, this.Name)
                }
            },
        });
    }
})(angular);