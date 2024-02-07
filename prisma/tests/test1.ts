import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

// sort: 'mac, order: 'asc' | 'desc'
async function findAllRobots(sort?: string, order?: string, page?: number, count?: number ) {  
  const limit = +(count ?? 20)
  const offset = (+(page ?? 1) -1) * limit
  const _sort = (sort ?? 'id').toString();
  const _order = order ?? 'asc';
  const orderBy = {[_sort]: _order};
  
  const robotList = await prisma.device.findMany({
    orderBy,
    take: limit,
    skip: offset
  })
}

async function findRobotByUuid(uuid: string) {
  
  const robot = await prisma.device.findUnique({
    where: {
      uuid: uuid
    },
  })

}

async function findRobotByMac(mac: string) {
  
  const robot = await prisma.device.findUnique({
    where: {
      mac: mac
    },
  })

}

async function updateRobot(mac: string) {

  const robot = await prisma.device.update({
    where: {
      mac: mac
    },
    data: {
      
    }
  })
}

async function main() {
  const robotType = await prisma.deviceType.create({
    data: {
      type: "ROBOT_T200",
      name: "Robot-T200",
      description: "Robot-T200 device type"
    }
  })
  console.log(robotType)
}


main()
.catch(e => {
  console.error(e.message);
})
.finally(async ()=> {
  await prisma.$disconnect()
})
