#include <QCoreApplication>
#include "udpsock.h"


int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);
    unsigned int port=9460;
    if(argc>1){
        port = std::stoi(argv[1]);
    }
    udpsock * us = new udpsock();
    us->init(port);
    return a.exec();
}
