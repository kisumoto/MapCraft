/*
 * Object for accessing to MapCraft hub.
 * It handles:
 *  * polling hub for events. on every event PieHub.poll_callback will be called
 *  * pushing data into hub (the result will be returned via poll)
 *  * genarating and saving sesid (session id)
 */

PieHub = {
    options: {
        pieid: null,
        hub_url: '/hub',
        poll_callback: null
    },
    sesid: null,
    polling: false,

    /*
     * init (PieId, poll_callback)
     */
    init: function(options) {
        $.extend(this.options, options);
        this.sesid = this.get_sesid();
    },

    /*
     * Polling: poll - after first call it will be called periodically
     */
    poll: function() {
        var self=this;
        var timeout = 0;

        this.poll_xhr = jQuery.ajax({
            type: 'GET',
            url: this.get_poll_url('pie'),
            cache: false,
            //dataType: 'json',
            success: function (data) {
                console.info("Succ!", data);
                self.options.poll_callback(data);
            },
            error: function(data) {
                console.error("Error in poll:", data);
                timeout = 100;
            },
            complete: function(res) {
                setTimeout(function() {self.poll();}, timeout);
            }
        });
    },
    restart_poll: function() {
        if(this.poll_xhr) {
            this.poll_xhr.abort();
        }
    },

    /*
     * Pushing: just call this func. Answer will be sent using poll connection
     */
    push: function(data) {
        var event = "async!json:" +  JSON.stringify(data);
        jQuery.ajax({
            type: 'POST',
            url: this.get_poll_url('pie'),
            data: event,
            //dataType: 'json',
            //success: cb,
            //error: err_cb
        });
    },

    /*
     * Sync call -- will wait for answer
     */
    call: function(data, cb, err_cb) {
        var event = "sync!json:" +  JSON.stringify(data);
        jQuery.ajax({
            type: 'POST',
            url: this.get_poll_url('pie'),
            data: event,
            dataType: 'json',
            success: cb,
            error: err_cb
        });
    },

    /*
     * Getters
     */
    get_poll_url: function(part) {
        return this.options.hub_url + '/' + part + '/' + this.options.pieid + '/' + this.sesid;
    },
    get_sesid: function() {
        var id = this.load_sesid() || this.gen_sesid();
        this.store_sesid(id);
        return id;
    },

    /*
     * Setters
     */
    set_pieid: function(pieid) {
        this.options.pieid = pieid;
        this.restart_poll();
    },

	/*
	 * Session save and restore sessionID
	 */
	store_sesid: function(id) {
        localStorage.sesid = id || this.sesid;
	},
	load_sesid: function() {
		return localStorage.sesid;
	},
    gen_sesid: function() {
        var templ = 'xxxxxxxxxxxxx';
        var id = templ.replace(/x/g, function(c) { return (Math.random()*16|0).toString(16); });
        return id;
    }
};
