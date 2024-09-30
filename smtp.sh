
# F
docker run --rm --name postfix -e "ALLOWED_SENDER_DOMAINS=sev-1.cse356.compas.cs.stonybrook.edu" -e "MYNETWORKS=69.120.128.55,130.245.136.0/24" -p 1587:587 boky/postfix

# Relay
docker run --rm --name postfix -e "ALLOWED_SENDER_DOMAINS=sev-1.cse356.compas.cs.stonybrook.edu" -e "MYNETWORKS=69.120.128.55,130.245.136.0/24" -e "RELAYHOST=jiechen3.cse356.compas.cs.stonybrook.edu" -p 1587:587 boky/postfix