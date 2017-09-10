var Connection = require('../db/dbConnection');

var DELAY = require('../../config.json').DELETEAFTER;

//Perform various tests to find out if the value sent is a user, checking name,
//nick and ID of given user. We use filter as a boolean to accept partial matches
exports.isUser = function(value, m, filter) {
    //We get all the values to ease handling
    value = value.toLowerCase();
    var username = m.user.username.toLowerCase();
    var nick = m.nickname;
    var bool = false;
    if (filter) { //If we only want strict matches
        bool = (username + "#" + m.user.discriminator) == value;
        bool = bool || username == value;
        if (nick) {
            nick = nick.toLowerCase();
            bool = bool || nick == value;
        }
    } else {
        bool = username.includes(value);
        if (nick) {
            nick = nick.toLowerCase();
            bool = bool || nick.includes(value);
        }
    }
    bool = bool || m.user.id == value;
    return bool;
}

//Find mentions and IDs
exports.getMembersFromMessage = function(msg, suffix) {
    var members = [];
    var users = msg.mentions.users.array();

    for (var mention of users) {
        members.push(msg.guild.members.get(mention.id));
    }

    for (var element of suffix) {
        if (msg.guild.members.has(element)) {
            members.push(msg.guild.members.get(element));
        }
    }

    return members;
}

exports.getOneMemberFromMessage = function(msg, suffix) {
    var mentionedMember;
    if (suffix) {
        var users = msg.mentions.users.array();
        if (users.length != 0) {
            mentionedMember = msg.guild.members.get(users[0].id);
        } else {
            var name = suffix.join(" ");
            if (name.length > 0) {
                mentionedMember = msg.guild.members.find((m) => {
                    return exports.isUser(name, m, true);
                });
                if (!mentionedMember) {
                    mentionedMember = msg.guild.members.find((m) => {
                        return exports.isUser(name, m, false);
                    });
                }
            }
        }
    }
    return (mentionedMember != null) ? mentionedMember : msg.member;
}

exports.getRole = function(guild, roleName) {
    if (roleName == null) return null;
    var role = guild.roles.find((r) => {
        return r.name.toLowerCase() == roleName.toLowerCase() ||
            r.id == roleName
    });
    return role;
}

exports.findLogsChannel = function(guild, callback) {
	var db = Connection.getDB();
    var channelID;
	var channelName = "log";

    if (db) {
        var collection = db.collection('guilds');

        collection.findOne({
            _id: guild.id
        }, function(err, res) {
            if (res && res.hasOwnProperty(channelName)) {
                channelID = res[channelName];
            }
            return fetchChannel(channelID, channelName, guild, callback);
        })
    } else {
        return fetchChannel(channelID, channelName, guild, callback);
    }
}

exports.findActivityChannel = function(guild) {
    return guild.channels.find("name", "activity-log");
}

exports.findSuggestionsChannel = function(guild, callback) {
    var db = Connection.getDB();
    var channelID;
	var channelName = "suggestions";

    if (db) {
        var collection = db.collection('guilds');

        collection.findOne({
            _id: guild.id
        }, function(err, res) {
            if (res && res.hasOwnProperty(channelName) && channelName != null) {
                channelID = res[channelName];
            }
            return fetchChannel(channelID, channelName, guild, callback);
        })
    } else {
        return fetchChannel(channelID, channelName, guild, callback);
    }


}
///////////////////// Helper function to get channels /////////////////////
function fetchChannel(channelID, name, guild, callback) {
	if (channelID) {
		callback(guild.channels.get(channelID));
	}
	// Default channel name is log
	callback(guild.channels.find("name", name));
}
///////////////////////////////////////////////////////////////////////////

exports.sendAndDelete = function(channel, content, delay) {
    var d = DELAY;
    if (delay) {
        d = delay;
    }
    channel.send(content).then((reply) => {
        setTimeout(() => {
            reply.delete();
        }, d);
    });
}

exports.missingPerms = function(action, guild, member){
	var out = `Missing permissions for [${action}] in ${guild.name}(${guild.id})`;
	if(member){
		out += ` at user ${member.user.username} (${member.user.id})`;
	}
	return out;
}
