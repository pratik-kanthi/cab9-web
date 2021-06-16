(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('ClientDispatchSettings', 'api/ClientDispatchSettings', {
            Id: { type: String },
            TenantId: { type: String },
            ClientId: { type: String },
            Client: { type: 'Client' },
            PriorityFactor: { type: Number },
            FIRST_PASS_DISTANCE: { type: Number, required: true },
            SECOND_PASS_DISTANCE: { type: Number, required: true },
            MAXIMUM_DISTANCE: { type: Number, required: true },
            DISTANCE_WEIGHTING: { type: Number, required: true },
            DISTANCE_BASE: { type: Number, required: true },
            DISTANCE_CAP: { type: Number, required: true },
            GREEN_WEIGHTING: { type: Number, required: true },
            GREEN_BASE: { type: Number, required: true },
            GREEN_CAP: { type: Number, required: true },
            FAIRNESS_WEIGHTING: { type: Number, required: true },
            FAIRNESS_BASE: { type: Number, required: true },
            FAIRNESS_CAP: { type: Number, required: true },
            RATING_WEIGHTING: { type: Number, required: true },
            RATING_BASE: { type: Number, required: true },
            RATING_CAP: { type: Number, required: true },
            SwapLevels: { type: Number, required: true },
            SwapPriorities: { type: Number, required: true }
        });
    }
})(angular);