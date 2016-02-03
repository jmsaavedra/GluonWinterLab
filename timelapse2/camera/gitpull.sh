#!/usr/bin/expect

cd ~/piFirmware

spawn git fetch local master

set timeout 180

expect "Password:" {
	send "git\r"
}

interact

cd ~/piFirmware

spawn git reset --hard FETCH_HEAD

expect "\r" {
	send "\r"
}

interact

# spawn sudo reboot
#
# expect "Password:" {
# 	send "pi\r"
# }
#
# interact
