FROM ubuntu:latest
LABEL authors="Dev"

ENTRYPOINT ["top", "-b"]