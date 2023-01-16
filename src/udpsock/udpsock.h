#ifndef UDPSOCK_H
#define UDPSOCK_H

#include <QObject>
#include <QUdpSocket>
#include <QNetworkDatagram>

class udpsock : public QUdpSocket
{
    Q_OBJECT
public:
    explicit udpsock(QObject *parent = nullptr);
    void init(unsigned int port=9460);
    QByteArray currentCache;       //当前接收的数据的缓存
    unsigned long currentSec = 0;      //当前接收的数据的时间戳
    unsigned int currentSize = 0;      //当前接收的数据的总大小
signals:
    void recvData(QByteArray);
public slots:
    void readPendingDatagrams();
};

#endif // UDPSOCK_H
