(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('AuditRecord', 'api/Audit', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            EntityType: {
                type: String
            },
            EntityId: {
                type: String
            },
            EntityName: {
                type: String
            },
            EntityDescription: {
                type: String
            },
            Timestamp: {
                type: moment
            },
            UserId: {
                type: String
            },
            User: {
                type: 'User'
            },
            Action: {
                type: String
            },
            Properties: {
                type: ['AuditPropertyRecord']
            },
            BookingEvent: {
                type: String
            }
        });

        ModelProvider.registerSchema('AuditPropertyRecord', 'api/AuditPropertyRecords', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            PropertyName: {
                type: String
            },
            PropertyType: {
                type: String
            },
            OldValue: {
                type: String
            },
            NewValue: {
                type: String
            },
            AuditRecordId: {
                type: moment
            },
            AuditRecord: {
                type: 'AuditRecord'
            }
        });
    }
})(angular);