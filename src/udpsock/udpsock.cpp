#include "udpsock.h"

udpsock::udpsock(QObject *parent) : QUdpSocket(parent)
{

}


void udpsock::init(unsigned int port)
{
    this->bind(QHostAddress::AnyIPv4, port);
    connect(this, SIGNAL(readyRead()), this, SLOT(readPendingDatagrams()));
}


void udpsock::readPendingDatagrams()
{
    while (this->hasPendingDatagrams()) {
        QNetworkDatagram datagram = this->receiveDatagram();
        QString str = QString::fromUtf8(datagram.data());
        qDebug().noquote()<<str;
        //QByteArray replyData;
        //replyData.append(str);
        //emit recvData(replyData);
    }
}
