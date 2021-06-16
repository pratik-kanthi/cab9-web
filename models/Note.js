(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Note', 'api/notes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            OwnerType: {
                type: String
            },
            OwnerId: {
                type: String,
            },
            Subject: {
                type: String,
                required: true
            },
            Content: {
                type: String,
                required: true
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time'
            },
            ModificationUserId: {
                type: String
            },
            CreationUserId: {
                type: String
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time'
            }
        });
    }
})(angular);