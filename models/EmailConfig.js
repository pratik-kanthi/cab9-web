(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('EmailConfig', 'api/emailConfig', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                hidden: true
            },
            SenderName: {
                type: String
            },
            BccAddress: {
                type: String
            },
            Mode: {
                type: String,
                enum: ['SMTP', 'Mailgun'],
                defaultValue: 'Mailgun'
            },
            SMTPServer: {
                type: String
            },
            SMTPEmail: {
                type: String
            },
            SMTPUsername: {
                type: String
            },
            SMTPPassword: {
                type: String,
                inputType: 'password'
            },
            SMTPPort: {
                type: Number
            },
            SMTPSecure: {
                type: Boolean
            },
            MailgunDomain: {
                type: String
            },
            MailgunKey: {
                type: String,
                inputType: 'password'
            },
            MailgunFromEmail: {
                type: String
            }
        });
    }
})(angular);