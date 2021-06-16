(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Booking', 'api/bookings', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            LocalId: {
                type: Number,
                editable: false
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Locked: {
                type: Boolean,
                hidden: true
            },
            LockedById: {
                type: String,
                hidden: true
            },
            HasEdits: {
                type: Boolean,
                hidden: true
            },
            FinanceValidated: {
                type: Boolean,
                hidden: true
            },
            DriverAck: {
                type: Boolean,
                hidden: true
            },
            BookingStatus: {
                type: String,
                enum: ['Rejected', 'Unconfirmed', 'Cancelled', 'Incoming', 'PreAllocated', 'Offered', 'Allocated', 'OnRoute', 'Arrived', 'InProgress', 'Clearing', 'Completed']
            },
            BookingSource: {
                type: String,
                enum: ['APP', 'WEB', 'PHONE', 'OTHER', 'ONETRANSPORT', 'CLIENT_PORTAL', 'IMPORTED', 'MORGAN_STANLEY', 'INFI9NITY', 'GROUNDSCOPE', 'HEREMaps', 'GETT', 'CITYFLEET']
            },
            NextStop: {
                type: Number
            },
            BookedDateTime: {
                type: moment,
                required: false,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            CreationTime: {
                type: moment,
                display: 'Creation Date',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            DriverOnRouteDateTime: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            DriverArrivedDateTime: {
                type: moment,
                required: false,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            POBDateTime: {
                type: moment,
                required: false,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            JobClearDateTime: {
                type: moment,
                required: false,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            ClientId: {
                type: String,
                required: false,
                displayField: 'Client.Name',
                table: {
                    hidden: true
                }
            },
            Client: {
                type: 'Client',
                ref: 'Client',
                refBy: 'ClientId',
                table: {
                    hidden: true
                }
            },
            ClientStaffId: {
                type: String,
                required: false,
                displayField: 'ClientStaff.Name',
                table: {
                    hidden: true
                }
            },
            ClientStaff: {
                type: 'ClientStaff',
                ref: 'ClientStaff',
                refBy: 'ClientStaffId',
                table: {
                    hidden: true
                }
            },
            DriverBids: {
                type: ['DriverBid'],
                table: {
                    hidden: true
                }
            },

            VehicleTypeId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            VehicleClassId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            VehicleType: {
                type: 'VehicleType',
                ref: 'VehicleType',
                refBy: 'VehicleTypeId',
                table: {
                    hidden: true
                }
            },
            Pax: {
                type: Number,
                table: {
                    hidden: true
                },
                required: true,
                min: 1,
                display: 'Max. Passengers'
            },
            FlightInfoId: {
                type: String,
                required: false,
                table: {
                    hidden: true
                }
            },
            FlightInfo: {
                type: 'FlightInfo',
                ref: 'FlightInfo',
                refBy: 'FlightInfoId',
                table: {
                    hidden: true
                }
            },
            Bax: {
                type: Number,
                table: {
                    hidden: true
                },
                required: true,
                min: 0,
                display: 'Max. Baggage'
            },
            FlightNo: {
                type: String,
                table: {
                    visible: false
                }
            },
            AsDirected: {
                type: Boolean,
                table: {
                    hidden: true
                }
            },
            WaitAndReturn: {
                type: Boolean,
                table: {
                    hidden: true
                }
            },
            CabShare: {
                type: Boolean,
                table: {
                    hidden: true
                }
            },
            LeadPassengerId: {
                type: String,
                required: false,
                displayField: 'LeadPassenger._Fullname',
                table: {
                    hidden: true
                }
            },
            LeadPassenger: {
                type: 'Passenger',
                ref: 'Passenger',
                refBy: 'LeadPassengerId',
                table: {
                    hidden: true
                }
            },
            DriverId: {
                type: String,
                required: false,
                displayField: '_DriverSummary',
                table: {
                    hidden: true
                }
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
                table: {
                    hidden: true
                }
            },
            VehicleId: {
                type: String,
                required: false,
                displayField: '_VehicleSummary',
                table: {
                    hidden: true
                }
            },
            Vehicle: {
                type: 'Vehicle',
                ref: 'Vehicle',
                refBy: 'VehicleId',
                table: {
                    hidden: true
                }
            },
            PartnerId: {
                type: String,
                required: false,
                table: {
                    hidden: true
                }
            },
            PartnerBookingStatus: {
                type: String,
                required: false,
                table: {
                    hidden: true
                }
            },
            Partner: {
                type: 'Partner',
                ref: 'Partner',
                refBy: 'PartnerId',
                table: {
                    hidden: true
                }
            },
            PartnerDriverId: {
                type: String,
                required: false,
                table: {
                    hidden: true
                }
            },
            PartnerDriver: {
                type: 'PartnerDriver',
                ref: 'PartnerDriver',
                refBy: 'PartnerDriverId',
                table: {
                    hidden: true
                }
            },
            PartnerVehicleId: {
                type: String,
                required: false,
                table: {
                    hidden: true
                }
            },
            PartnerVehicle: {
                type: 'PartnerVehicle',
                ref: 'PartnerVehicle',
                refBy: 'PartnerVehicleId',
                table: {
                    hidden: true
                }
            },
            PartnerRef: {
                type: String,
                required: false,
                table: {
                    hidden: true
                }
            },
            EncodedRoute: {
                type: String
            },
            PassengerNotes: {
                type: String,
                table: {
                    visible: false
                }
            },
            PassengerNotificationPhone: {
                type: "Phone",
                table: {
                    visible: false
                }
            },
            DriverNotes: {
                type: String,
                table: {
                    visible: false
                }
            },
            OfficeNotes: {
                type: String,
                table: {
                    visible: false
                }
            },
            JobCron: {
                type: String
            },
            AutoDispatch: {
                type: Boolean,
                table: {
                    visible: false
                }
            },
            DispatchDateTime: {
                type: moment,
                required: false,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    visible: false
                }
            },
            EstimatedDistance: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            EstimatedDuration: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            EstimatedCost: {
                type: Number,
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
                table: {
                    hidden: true
                },
            },
            ActualRoute: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ActualCost: {
                type: Number,
                table: {
                    hidden: true
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
            },
            Adjustments: {
                type: ['ClientInvoiceAdjustment'],
                table: {
                    hidden: true
                }
            },
            DriverCost: {
                type: Number,
                table: {
                    hidden: true
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
            },
            InvoiceCost: {
                type: Number,
                table: {
                    hidden: true
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
            },
            AdjustmentTotal: {
                type: Number,
                table: {
                    hidden: true
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}'
                },
            },
            Coupon: {
                type: String
            },
            InvoiceId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Invoice: {
                type: 'Invoice',
                table: {
                    hidden: true
                }
            },
            Date: {
                type: moment,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
            },
            Time: {
                type: String,
                inputType: 'time',
                displayField: '_Time',
                // displayFilters: " | companyDate:'HH:mm'",
                table: {
                    hidden: true
                }
            },
            ImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            PassengerSignatureImageUrl: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Priority: {
                type: Number,
                min: 1,
                max: 5,
                table: {
                    hidden: true
                }
            },
            PricingModelId: {
                type: String
            },
            ChauffeurMode: {
                type: Boolean
            },
            EstimatedMins: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ActualMins: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            ActualDistance: {
                type: Number,
                table: {
                    hidden: true
                }
            },
            WaitingCost: {
                type: Number
            },
            WaitingTime: {
                type: Number
            },
            ExtrasCost: {
                type: Number
            },
            PassengerScore: {
                type: Number
            },
            DriverScore: {
                type: Number
            },
            DriverCommission: {
                type: Number
            },
            CompanyCommission: {
                type: Number
            },
            DriverCommissionTax: {
                type: Number
            },
            CompanyCommissionTax: {
                type: Number
            },
            JourneyCommission: {
                type: Number
            },
            ExtrasCommission: {
                type: Number
            },
            DriverAdjustmentTotal: {
                type: Number
            },
            DriverAdjustmentTax: {
                type: Number
            },
            WaitingCommission: {
                type: Number
            },
            CompanyWaitingCommission: {
                type: Number
            },
            DriverInvoiceId: {
                type: String
            },
            DriverBillId: {
                type: String
            },
            GroundscopeReference: {
                type: String
            },
            ManualCommission: {
                type: Number
            },
            _ImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    if (this.ImageUrl) {
                        if (this.ImageUrl.slice(0, 4) == 'http') {
                            return this.ImageUrl;
                        } else {
                            return window.resourceEndpoint + this.ImageUrl;
                        }
                    } else {
                        var result = $config.GMAPS_STATIC_URL + "&markers=" +
                            encodeURIComponent("shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-start@2x.png|" + (this._FromCoords || this._FromSummary)) +
                            "&markers=" +
                            encodeURIComponent("shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-finish@2x.png|" + (this._ToCoords || this._ToSummary)) +
                            '&key=' + window.googleMapsKey;
                        //if (this.EncodedRoute) {
                        //  result += "&path=" +
                        //  encodeURIComponent("weight:5|color:0x2dbae4ff|enc:" + encodeURIComponent(this.EncodedRoute));
                        //}

                        return result;
                    }
                }
            },
            _PassengerSignatureImageUrl: {
                type: String,
                hidden: true,
                calculated: function () {
                    if (this.PassengerSignatureImageUrl) {
                        if (this.PassengerSignatureImageUrl.slice(0, 4) == 'http') {
                            return this.PassengerSignatureImageUrl;
                        } else {
                            return window.resourceEndpoint + this.PassengerSignatureImageUrl;
                        }
                    }
                }
            },
            _Time: {
                type: String,
                calculated: function () {
                    return new moment(this.Time).format('HH:mm');
                },
                table: {
                    hidden: true
                }
            },
            _LeadPassenger: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _LeadPassengerNumber: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _LeadPassengerEmail: {
                type: String,
                table: {
                    hidden: true
                }
            },
            BookingTags: {
                type: ['BookingTag'],
                ref: 'BookingTag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Tags: {
                type: ['Tag'],
                ref: 'Tag',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Passengers: {
                type: ['Passenger'],
                ref: 'Passenger',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            BookingStops: {
                type: ['BookingStop'],
                ref: 'BookingStop',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Reference: {
                type: String
            },
            Dispute: {
                type: Boolean
            },
            BookingValidations: {
                type: ['BookingValidation'],
                ref: 'BookingValidation',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Conversations: {
                type: ['Conversation'],
                ref: 'Conversation',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            Notifications: {
                type: [],
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            BookingRequirements: {
                type: ['BookingRequirement'],
                ref: 'BookingRequirement',
                refType: 'ManyToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            _FromCoords: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        var model = this.BookingStops[0];
                        if (model.Latitude && model.Longitude) {
                            return model.Latitude + ',' + model.Longitude;
                        }
                    }
                }
            },
            _ToCoords: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        var model = this.BookingStops[this.BookingStops.length - 1];
                        if (model.Latitude && model.Longitude) {
                            return model.Latitude + ',' + model.Longitude;
                        }
                    }
                }
            },
            _FromSummary: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        var model = this.BookingStops[0];
                        var model1 = this.BookingStops[this.BookingStops.length - 1];
                        var add = "";
                        if (model.StopSummary && model.StopSummary.length > 0) {
                            add = model.StopSummary;
                        } else {
                            if (model.Address1 && model.Address1.length > 0) {
                                add += model.Address1;
                            }
                            if (model.TownCity && model.TownCity.length > 0) {
                                if (add.trim().length > 0) {
                                    add += ', ';
                                }
                                add += model.TownCity;
                            } else if (model.Area && model.Area.length > 0) {
                                if (add.trim().length > 0) {
                                    add += ', ';
                                }
                                add += model.Area;
                            }
                            if (model.County && add.length == 0 && model.County.length > 0) {
                                add += model.County;
                            }
                            if (model.Postcode && model.Postcode.length > 0) {
                                if (add.trim().length > 0) {
                                    add += ', ';
                                }
                                add += model.Postcode;
                            }
                        }
                        return add;
                    }
                }
            },
            _ToSummary: {
                type: String,
                calculated: function () {
                    if (this.BookingStops && this.BookingStops.length) {
                        if (this.BookingStops.length > 1) {
                            var model = this.BookingStops[this.BookingStops.length - 1];
                            var add = "";
                            if (model.StopSummary) {
                                add = model.StopSummary;
                            } else {
                                if (model.Address1 && model.Address1.length > 0) {
                                    add += model.Address1;
                                }
                                if (model.TownCity && model.TownCity.length > 0) {
                                    if (add.length > 0) {
                                        add += ', ';
                                    }
                                    add += model.TownCity;
                                } else if (model.Area && model.Area.length > 0) {
                                    if (add.length > 0) {
                                        add += ', ';
                                    }
                                    add += model.Area;
                                }
                                if (model.County && add.length == 0 && model.County.length > 0) {
                                    add += model.County;
                                }
                                if (model.Postcode && model.Postcode.length > 0) {
                                    if (add.length > 0) {
                                        add += ', ';
                                    }
                                    add += model.Postcode;
                                }
                            }
                            return add;
                        } else {
                            return "As Directed";
                        }
                    } else {
                        return 'As Directed';
                    }
                }
            },
            //TODO
            _JourneySummary: {
                type: String,
                calculated: function () {
                    if (this.BookingStops) {
                        var journeyParts = [];
                        for (i = 0; i < this.BookingStops.length; i++) {
                            var summaryParts = [];
                            var _bs = this.BookingStops[i];
                            if (['TUBESTATION', 'AIRPORT'].indexOf(_bs.LocationType) > -1) {
                                if (_bs.Address1 && _bs.Address1.length > 0 && _bs.Address1 != ' ') {
                                    summaryParts.push(_bs.Address1);
                                } else if (_bs.Address2 && _bs.Address2.length > 0) {
                                    summaryParts.push(_bs.Address2);
                                }
                            } else if (_bs.TownCity && _bs.TownCity.length > 0 && _bs.TownCity.toLowerCase().indexOf('london') != -1) {
                                if (_bs.Postcode && _bs.Postcode.length > 0) {
                                    summaryParts.push(_bs.Postcode);
                                }
                            } else {
                                if (_bs.Address1 && _bs.Address1.length > 0) {
                                    summaryParts.push(_bs.Address1);
                                }
                                if (summaryParts.length == 0) {
                                    if (_bs.TownCity && _bs.TownCity.length > 0) {
                                        summaryParts.push(_bs.TownCity);
                                    }
                                }
                                if (_bs.Postcode && _bs.Postcode.length > 0) {
                                    summaryParts.push(_bs.Postcode);
                                }
                            }
                            if (summaryParts.length == 0) {
                                summaryParts.push(_bs.StopSummary);
                            }
                            journeyParts.push(summaryParts.join(', '));
                        }

                        if (this.BookingStops.length == 1) {
                            journeyParts.push("As Directed");
                        }
                    } else {
                        return "Invalid Stops"
                    }
                    return journeyParts.join(' - ');
                }
            },
            _ClientName: {
                type: String,
                display: 'Client',
                calculated: function () {
                    return (this.Client && this.Client.Name);
                }
            },
            _VehicleReg: {
                type: String,
                display: 'Vehicle',
                calculated: function () {
                    return (this.Vehicle && this.Vehicle.Registration);
                }
            },
            _DriverSummary: {
                type: String,
                display: 'Driver',
                calculated: function () {
                    return (this.Driver && (this.Driver.Firstname + ' ' + this.Driver.Surname + ' (' + this.Driver.Callsign + ')'));
                }
            },
            _VehicleSummary: {
                type: String,
                display: 'Vehicle',
                calculated: function () {
                    return (this.Vehicle && (this.Vehicle.Colour + ' ' + this.Vehicle.Make + ' ' + this.Vehicle.Model + ' (' + this.Vehicle.Registration + ')'));
                }
            },
            _LeadPassengerName: {
                type: String,
                display: 'Lead Passenger',
                calculated: function () {
                    if (this.LeadPassenger)
                        return (this.LeadPassenger.Firstname + ' ' + this.LeadPassenger.Surname);
                }
            },
            _WaitTime: {
                type: Number,
                calculated: function () {
                    var result = 0;
                    if (this.BookingStops) {
                        for (var i = 0; i < this.BookingStops.length; i++) {
                            if (i.WaitTime)
                                result += i.WaitTime;
                        }
                    }
                    return result;
                }
            },
            _WaitTimeCharges: {
                type: Number,
                calculated: function () {
                    var result = 0;
                    if (this.BookingStops) {
                        result = this.BookingStops[0] && this.BookingStops[0].WaitTimeChargable;
                    }
                    return result;
                }
            },
            CurrencyId: {
                type: String
            },
            Currency: {
                type: 'Currency',
                ref: 'Currency',
                refBy: 'CurrencyId'
            },
            CurrencyRate: {
                type: Number
            },
            BookingExpense: {
                type: ['BookingExpense'],
                hidden: true
            },
            TaxId: {
                type: String,
                display: 'VAT',
                displayField: 'Tax.Name',
                required: true
            },
            Tax: {
                type: 'Tax',
                ref: 'Tax',
                refBy: 'TaxId',
            },
            Discount: {
                type: Number,
                append: {
                    text: '%',
                    click: "discount.type = 'percent';"
                },
                prepend: {
                    text: '{{symbol || current.Prepend}}',
                    click: "discount.type = 'amount';"
                }
            },
            DriverPaymentId: {
                type: String,
                display: 'Driver Payment'
            },
            DriverPayment: {
                type: 'DriverPayment',
                ref: 'DriverPayment',
                refBy: 'DriverPaymentId',
            },
            PaymentMethod: {
                type: String,
                defaultValue: 'OnAccount',
                enum: ['Cash', 'Card', 'OnAccount', 'Other']
            },
            InfinityReference: {
                type: String,
                visible: false
            },
            OneTransportReference: {
                type: String,
                visible: false
            },
            CityFleetReference: {
                type: String,
                visible: false
            },
            OneTransportVendorReference: {
                type: String,
                visible: false
            },
            OneTransportStatus: {
                type: String,
                visible: false,
                enum: ['Unconfirmed', 'TimedOut', 'Rejected', 'HandedBack', 'AutoAccepted', 'Accepted']
            },
            OneTransportReceived: {
                type: String,
                visible: false
            },

            CallOnArrival: {
                type: Boolean,
                defaultValue: false
            },
            TextOnArrival: {
                type: Boolean,
                defaultValue: true
            },
            TextConfirmation: {
                type: Boolean,
                defaultValue: true
            },
            EmailConfirmation: {
                type: Boolean,
                defaultValue: true
            },
            TextAssigned: {
                type: Boolean,
                defaultValue: false
            },
            EmailAssigned: {
                type: Boolean,
                defaultValue: false
            },
            TextOnCompletion: {
                type: Boolean,
                defaultValue: true
            },
            TextOnOnRoute: {
                type: Boolean,
                defaultValue: false
            },
            BookedDateTimeEdit: {
                type: moment,
                required: false,
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    hidden: true
                }
            },
            TimeEdit: {
                type: String,
                inputType: 'time',
                displayField: '_Time',
                table: {
                    hidden: true
                }
            },
            DriverExclusions: {
                type: Number,
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
            CreationUser: {
                type: 'User'
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            },
            PaymentCardId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CardPaymentStatus: {
                type: String,
                enum: ['PreauthTaken', 'Pending', 'Success', 'Failure']
            },
            PaymentCard: {
                type: 'PaymentCard',
                ref: 'PaymentCard',
                refBy: 'PaymentCardId',
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);