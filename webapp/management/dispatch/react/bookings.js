import React from "react";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

const Journey = (props) => {
    return (
        <div className="journey">
            <div className="indicators">
                {props.booking.$pre && <div className="tag pre">PRE</div>}

                {(props.booking.PaymentMethod == 'OnAccount') && <div className="tag icon">
                    <i className='material-icons'>account_balance</i>
                </div>}

                {(props.booking.PaymentMethod == 'Card') && <div className="tag icon">
                    <i className='material-icons'>credit_card</i>
                </div>}

                {(props.booking.PaymentMethod == 'Cash') && <div className="tag icon">
                    <i className='material-icons'>account_balance_wallet</i>
                </div>}

                <div className={'tag booking-source ' + props.booking.BookingSource}>{props.booking.BookingSource.substring(0,3)}</div>
                <div className={'tag vehicle ' + props.booking.VehicleType.Name} style={{ backgroundColor: props.booking.VehicleType.Colour}}>{props.booking.VehicleType.Name}</div>
                {(props.booking.OfficeNotes || props.booking.DriverNotes || props.booking.PassengerNotes) && <div className="tag icon notes">
                    <i className="material-icons">speaker_notes</i></div>}
                {(props.booking.BookingTags.length > 0) && <div className="tag icon tags" style={{ backgroundColor: '#3b4752'}}>
                    <i className="material-icons">label_important</i></div>}
                {props.booking.FlightInfo && <div className="tag icon flight">
                    <i className="material-icons">airplanemode_active</i>
                    {props.booking.FlightInfo.FlightNumber}
                </div>}
                {props.booking.new && <div class="tag new">NEW</div>}

            </div>
            <div className="text">
                <strong className="pickup">{props.booking.Summary}</strong>
            </div>
        </div>
    )
}

const Passenger = (props) => {
    return (
        <div className="passenger">

            <div className="text">
                {(props.booking.LeadPassenger.VIP == true) && <strong>(VIP) </strong>}
                <span>{props.booking.LeadPassenger.Firstname + ' ' + props.booking.LeadPassenger.Surname}</span>
            </div>
            {(!!props.booking.Client) && <div className="text">
                <span className={'label client-priority ' + (props.booking.Priority ? ('P' + props.booking.Priority) : props.booking.Client.Priority)}>{(props.booking.Priority ? ('P' + props.booking.Priority) : props.booking.Client.Priority)}</span>
                <strong>{((props.booking.Client.AccountNo ? '(' + props.booking.Client.AccountNo + ') ' : '') + props.booking.Client.Name)}</strong>
            </div>}
        </div>
    )
}

const Driver = (props) => {

    const PartnerBooking = () => {
        return (
            <div className="driver">
                <div>
                    <div className="text">
                    {props.booking.Partner.PartnerName && props.booking.Partner.PartnerName.indexOf(' ') != -1 && <strong> {('(WS:' + props.booking.Partner.PartnerName.split(" ")[0] + ')')}</strong>}
                        {props.booking.Partner.PartnerName && props.booking.Partner.PartnerName.indexOf(' ') == -1 && <strong> {('(WS:' + props.booking.Partner.PartnerName + ')')}</strong>}
                        <span>{(props.booking.PartnerDriver) && (props.booking.PartnerDriver.Name)}</span>
                    </div>
                    {(["UpdatePending","Pending","UpdateRequested","Requested"].indexOf(props.booking.PartnerBookingStatus)!=-1) ?
                    <div className="text">
                        <span className="vehicle">{props.booking.PartnerBookingStatus}</span>
                    </div>
                    :
                    <div className="text">
                        <span className="vehicle">{props.booking.PartnerVehicle
                                ? props.booking.PartnerVehicle._Description
                                : 'Not Assigned'}
                        </span>
                    </div>
                    }
                </div>
            </div>
        )
    }
    const UnconfirmedBooking = () => {
        return (
            <div className="driver">
                {(props.booking.Driver && props.booking.BookingStatus != 'PreAllocated') && <div>
                    <div className="text">
                        {!(props.booking.DriverAck) && <i className="material-icons red">warning</i>}
                        <strong>{('(' + props.booking.Driver.Callsign + ')')}</strong>&nbsp;
                        <span>{(props.booking.Driver.Firstname)}</span>&nbsp;
                        <span>{props.booking.Driver.Surname}</span>
                    </div>
                    <div className="text">
                        <span className="vehicle">{props.booking.Vehicle
                                ? props.booking.Vehicle._Description + ' ' + props.booking.Vehicle.Registration
                                : ''}</span>
                    </div>
                </div>}

                {(props.booking.Partner) && <div>
                    <div className="text">
                        <strong>{('(' + props.booking.Partner.PartnerType + ')')}</strong>&nbsp;
                        <span>{(props.booking.PartnerDriver) && (props.booking.PartnerDriver.Name)}</span>
                    </div>
                    <div className="text">
                        <span className="vehicle">{props.booking.PartnerVehicle
                                ? props.booking.PartnerVehicle._Description
                                : 'Not Assigned'}</span>
                    </div>
                </div>}


                {(props.booking.Driver && props.booking.BookingStatus == 'PreAllocated') && <div>
                    <div className="text">
                        <strong>{('(' + props.booking.Driver.Callsign + ')')}</strong>&nbsp;
                        <span>{(props.booking.Driver.Firstname)}</span>&nbsp;
                        <span>{props.booking.Driver.Surname}</span>
                    </div>
                    {props.booking.$offer && <div className="text">
                        {(props.booking.$offer.Status == 'Sent' && props.booking.$offer.Attempts == 1) && <span>Sending..</span>}
                        {(props.booking.$offer.Status == 'Sent' && props.booking.$offer.Attempts > 1) && <span>{'Retrying ' + props.booking.$offer.Attempts - 1 + '..'}</span>}
                        {(props.booking.$offer.Status == 'Read' && !props.booking.$offer.ResponseTime) && <span>Read</span>}
                        {(props.booking.$offer.Status == 'Rejected' && props.booking.$offer.ResponseTime && props.booking.$offer.Accepted == 0) && <span>Driver Rejected!</span>}
                        {(props.booking.$offer.Status == 'Rejected' && !props.booking.$offer.ResponseTime) && <span>Exceeded!</span>}
                    </div>}
                    {!props.booking.$offer && <div className="text">
                        <button
                            className="btn btn-xs btn-success"
                            onClick={(event) => {
                            event.preventDefault();
                            props.allocateDriver(props.booking, props.booking.DriverId)
                        }}
                            style={{
                            paddingLeft: '12px',
                            lineHeight: '20px',
                            height: '20px'
                        }}>Confirm Allocation</button>
                    </div>}
                </div>}
                {(!props.booking.Partner && !props.booking.Driver && !props.booking.$offer && !props.booking.$recommendation) && <div
                    onClick={(event) => {
                    event.preventDefault();
                    props.allocateDriver(props.booking)
                }}>
                    <i className="material-icons add" style={{ 'lineHeight': props.booking.$ad ? '27px' : ''}}>add_circle</i>
                    <p style={{ 'lineHeight': props.booking.$ad ? '27px' : '' }}>Add Driver</p>
                    {props.booking.$ad && <div style={{'height': '20px', 'fontSize': '85%', 'overflow': 'hidden'}}>{props.booking.$ad}</div>}
                </div>}
                {(!props.booking.Partner && !props.booking.Driver && props.booking.$offer) && <div
                    onClick={(event) => {
                    event.preventDefault();
                    props.allocateDriver(props.booking)
                }}>
                    <div>
                        <div className="text">
                            <strong>{'(' + props.booking.$offer.Driver.Callsign + ')'}</strong>&nbsp;
                            <span>{props.booking.$offer.Driver.Firstname}</span>&nbsp;
                            <span>{props.booking.$offer.Driver.Surname}</span>
                        </div>
                        <div className="text">
                            {props.booking.$offer && <div>
                                {(props.booking.$offer.Status == 'Sent' && props.booking.$offer.Attempts == 1) && <span>Sending..</span>}
                                {(props.booking.$offer.Status == 'Sent' && props.booking.$offer.Attempts > 1) && <span>{'Retrying ' + (props.booking.$offer.Attempts - 1) + '..'}</span>}
                                {(props.booking.$offer.Status == 'Read' && !props.booking.$offer.ResponseTime) && <span>Read</span>}
                                {(props.booking.$offer.Status == 'Rejected' && props.booking.$offer.ResponseTime && props.booking.$offer.Accepted == 0) && <span>Driver Rejected!</span>}
                                {(props.booking.$offer.Status == 'Rejected' && !props.booking.$offer.ResponseTime) && <span>Retries Exceeded!</span>}
                            </div>}
                        </div>
                    </div>
                </div>}

                {(!props.booking.Partner && !props.booking.Driver && !props.booking.$offer && props.booking.$recommendation) && <div>
                    <div>
                        <div
                            className="text"
                            style={{
                                opacity: '0.5'
                            }}>
                            <strong>{'(' + props.booking.$recommendation.Callsign + ')'}</strong>&nbsp;
                            <span>{props.booking.$recommendation.Firstname}</span>&nbsp;
                            <span>{props.booking.$recommendation.Surname}</span>
                        </div>
                        <button
                            className="btn btn-xs btn-success"
                            onClick={(event) => {
                                event.preventDefault();
                                props.allocateDriver(props.booking, props.booking.$recommendation.DriverId)
                            }}
                            style={{
                                paddingLeft: '12px',
                                lineHeight: '20px',
                                height: '20px'
                            }}>Confirm Allocation</button>
                    </div>
                </div>}

            </div>
        )
    }

    const AwaitingConfirm = () => {
        return (
            <div className="accept-reject">
                Awaiting Confirmation
            </div>
        )
    }

    const ConfirmedBooking = () => {
        return (
            <div className="accept-reject">
                <button
                    disabled={props.booking.$loading}
                    className="btn btn-xs btn-success"
                    onClick={(event) => {
                    event.preventDefault();
                    props.acceptBooking(props.booking)
                }}>
                    <i className="material-icons">thumb_up</i>Accept</button>&nbsp;
                <button
                    disabled={props.booking.$loading}
                    className="btn btn-xs btn-danger"
                    onClick={(event) => {
                    event.preventDefault();
                    props.rejectBooking(props.booking)
                }}>
                    <i className="material-icons">thumb_down</i>Reject</button>
            </div>
        )
    }

    if (props.booking.BookingStatus == 'Unconfirmed') {
        if (props.booking.OneTransportStatus == 'Accepted' || props.booking.OneTransportStatus == 'AutoAccepted') {
            return <AwaitingConfirm />
        } else {
            return <ConfirmedBooking />
        }
    }
    else {
        if (props.booking.PartnerId && props.booking.PartnerBookingStatus && props.booking.BookingSource!='WORKSHARE') {
            return <PartnerBooking / >
        } else {
            return <UnconfirmedBooking / >
        }
    }

}

const Time = (props) => {
    return (
        <div className="time" onClick={(event) => {
                event.preventDefault();
                props.editBooking(props.booking)
                }}>
            <strong className="badge">{props.companyDateFilter(props.booking.BookedDateTime, 'HH:mm')}</strong>
            <div className="text">
                <span>{props.booking.$countdown}</span>
            </div>
        </div>
    )
}

const Status = (props) => {
    return (
        <div className="status">
            <strong className="badge">{props.booking.BookingStatus}</strong>
            <div className="text">
                <span>{props.booking.$eta}</span>
                {props.booking.OneTransportStatus != 'Accepted' && props.booking.OneTransportStatus != 'AutoAccepted' && <span>{props.booking.$countup}</span>}

            </div>
        </div>
    )
}

const Actions = (props) => {
    return (
        <div className="action">

            <button
                className="expand select"
                onClick={(event) => {
                event.preventDefault();
                props.selectBooking(props.booking)
            }}>
                <i className="material-icons">place</i>
            </button>
            <button
                className="expand"
                onClick={(event) => {
                event.preventDefault();
                props.openBooking(props.booking)
                }}>
                <i className="material-icons">visibility</i>
            </button>
            {props.booking.$warning &&
                <OverlayTrigger
                    placement="left"
                    overlay={
                        <Tooltip>
                            {props.booking.$warning.Message}
                        </Tooltip>
                    }
                >
                    <button
                    className={'expand warning ' + props.booking.$warning.Severity}
                    style={{ 'animation': 'blink-animation 1s steps(2, start) infinite;' }}
                    onClick={(event) => {
                        event.preventDefault();
                        props.openBooking(props.booking)
                    }}>
                    {props.booking.$warning.Severity == 'Low' && <i className="material-icons">info</i>}
                    {props.booking.$warning.Severity == 'Medium' && <i className="material-icons">warning</i>}
                    {props.booking.$warning.Severity == 'High' && <i className="material-icons">error</i>}
                    </button>
                </OverlayTrigger>
            }

            {((props.booking.BookingStatus == 'OpenToBid' || props.booking.BookingStatus == 'Incoming') && props.enableBidding)&&<button
                className="expand"
                onClick={(event) => {
                event.preventDefault();
                props.addToBidQueue(props.booking)
            }}>
            { (() => {
                    if(!props.booking.DriverBids || props.booking.DriverBids.length == 0) {
                        return <i className="material-icons">supervisor_account</i>
                    }
                    else if(props.booking.DriverBids.length > 9) {
                        return <i className="material-icons grey">filter_9_plus</i>
                    } else {
                        return <i className="material-icons grey">{'filter_' + props.booking.DriverBids.length}</i>
                    }
                })()
            }
            </button>}

            {props.booking.$recentlyCompleted && <button
                className="expand"
                onClick={(event) => {
                event.preventDefault();
                props.removeCompleted(props.booking)
            }}>
                <i className="material-icons">check_circle</i>
            </button>}

            {props.booking.$recentlyCancelled && <button
                className="expand"
                onClick={(event) => {
                event.preventDefault();
                props.removeCancelled(props.booking)
            }}>
                <i className="material-icons">check_circle</i>
            </button>}

            {props.booking.HasEdits && <button
                className="expand"
                onClick={(event) => {
                event.preventDefault();
                props.approveChanges(props.booking)
            }}>
                <i
                    className="material-icons "
                    style={{
                    transform: 'rotate(180deg)'
                }}>info</i>
            </button>}
        </div>
    )
}

export default class Bookings extends React.Component {
    constructor(props) {
        super(props)
    }
    componentWillMount() {
        console.log("Component mounting")
    }
    componentWillUnmount() {
        console.log("Component unmounting")
    }


    openBooking = (booking) => {
        this
            .props
            .openBooking({booking});
    }

    editBooking = (booking) => {
        this
            .props
            .editBooking({booking});
    }

    openBidding = (booking) => {
        this
            .props
            .openBidding({booking});
    }

    selectBooking = (booking) => {
        this
            .props
            .selectBooking({booking});
    }

    removeCompleted = (booking) => {
        this
            .props
            .removeCompleted({booking});
    }

    removeCancelled = (booking) => {
        this
            .props
            .removeCancelled({booking});
    }

    approveChanges = (booking) => {
        this
            .props
            .approveChanges({booking});
    }

    allocateDriver = (booking, driverId, misc) => {
        this
            .props
            .allocateDriver({booking: booking, driverId: driverId, misc: misc});
    }

    confirm = (type, notify, booking, driverId) => {
        this
            .props
            .confirm({type: type, notify: notify, booking: booking, driverId: driverId});
    }

    acceptBooking = (booking) => {
        this
            .props
            .acceptBooking({booking});
    }

    rejectBooking = (booking) => {
        this
            .props
            .rejectBooking({booking});
    }

    companyDate = (bookedDateTime) => {
        this
            .props
            .companyDate({date: bookedDateTime, format: 'HH:mm'});
    }

    addToBidQueue = (booking) => {
        booking.$selected = !booking.$selected;
        this.setState({
            bookings: this.props.bookings
        });
    }

    render() {

        this.state = {
           bookings: this.props
               .bookings
        };

        return (
            <div>
                {this
                    .props
                    .bookings
                    .map((booking) => {
                        return <div key={booking.Id}>
                            <div className={'booking ' + booking.BookingStatus + ' ' + (booking.$selected?'selected':'')}>
                                <div className="content-wrapper">
                                    <Journey booking={booking}/>
                                    <Passenger booking={booking}/>
                                    <Driver
                                        booking={booking}
                                        allocateDriver={this.allocateDriver}
                                        confirm={this.confirm}
                                        acceptBooking={this.acceptBooking}
                                        rejectBooking={this.rejectBooking}
                                        dispatchObj={this.props.dispatchObj} />
                                    <Time booking={booking} companyDateFilter={this.props.companyDateFilter} editBooking={this.editBooking}/>
                                    <Status booking={booking}/>
                                    <Actions
                                        enableBidding={this.props.enableBidding}
                                        booking={booking}
                                        selectBooking={this.selectBooking}
                                        openBooking={this.openBooking}
                                        addToBidQueue={this.addToBidQueue}
                                        removeCompleted={this.removeCompleted}
                                        removeCancelled={this.removeCancelled}
                                        approveChanges={this.approveChanges}/>
                                </div>
                            </div>
                        </div>

                    })
}
            </div>

        )
    }
}