# JavaScript SDK

## Getting Started:

### Step: 1

Copy this Snippet and Paste into the HEAD of each page that you want to track on your site.

```html
<script>
!function(t,e){function n(t){a.prototype[t]=function(){return this._q.push([t].concat(Array.prototype.slice.call(arguments,0))),this}}function o(t){s[t]=function(){s._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}var s=t.tongdao||{},r=e.createElement("script");r.type="text/javascript",r.async=!0,r.src="https://0qian-production-app.oss-cn-hangzhou.aliyuncs.com/js-sdk/v0/tongdao.min.js",r.onload=function(){t.tongdao.runQueuedFunctions()};var i=e.getElementsByTagName("script")[0];i.parentNode.insertBefore(r,i);for(var a=function(){return this._q=[],this},c=["add","set","setOnce","unset"],u=0;u<c.length;u++)n(c[u]);s.Identify=a,s._q=[];for(var p=["init","track","redirect","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","setGlobalUserProperties","identify"],d=0;d<p.length;d++)o(p[d]);t.tongdao=s}(window,document),

tongdao.init("YOUR-APP-KEY");
</script>
```

### Step 2

Locate your APP Key from the Tongdao portal, and replace "YOUR-APP-KEY" with your APP Key in the snippet

ex.

```javascript
tongdao.init("9e1e84898a6692d92276b2f289354254");

```

That's it! This will get you started by tracking basic events such as he initial identifying of new users and their sessions.


## Adding Custom Track Events
##### Warning : Custom event and property names must be set up in the portal prior to using its name in a request

To add a custom track event simply call the `tongdao.track()` function anywhere on a page.

The `.track()` function takes 3 arguments:
```javascript
tongdao.track('event_name', [{properties}], [callback()])
```

| argument | type | description |
| --- | --- | --- |
|`'event_name'`| string | The exact name of your custom event you would like to track |
|`{properties}`| object (optional) | Add any custom properties to an event. properties must be in an Object where the keys are the name of the custom property {custom_property: value} |
|`callback()` | function (optional) | Set a custom callback to be fired after the track data as been sent |

ex.

```javascript
tongdao.track('button_clicked', {current_page: location.href}, function(){alert('button was clicked');} );
```
