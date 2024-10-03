
# F
docker run -d --name postfix --network host -e "ALLOWED_SENDER_DOMAINS=sev-1.cse356.compas.cs.stonybrook.edu" -e "MYNETWORKS=69.120.128.55,130.245.136.0/24" -p 1587:587 boky/postfix
ip6tables -I OUTPUT -p tcp -m tcp --dport 25 -j DROP
iptables -t nat -I OUTPUT -p tcp -m tcp --dport 25 -j DNAT --to-destination 130.245.136.123:11587

# Relay
# docker run --rm --name postfix -e "ALLOWED_SENDER_DOMAINS=sev-1.cse356.compas.cs.stonybrook.edu" -e "MYNETWORKS=69.120.128.55,130.245.136.0/24" -e "RELAYHOST=jiechen3.cse356.compas.cs.stonybrook.edu" -p 1587:587 boky/postfix