import { useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Popconfirm,
  Row,
  Space,
  Tag,
  message,
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { useDeleteDictData, useDeleteDictType, useDictLookups, useListAllDictType } from '@/api/hooks/dict';
import { batchDictDataApi, listDictDataApi } from '@/api/rest/dict-data';
import { batchDictTypeApi, listDictTypeApi } from '@/api/rest/dict-type';
import type { DictData, DictType } from '@/api/rest/types';
import { queryClient } from '@/core';
import { TABLE } from '@/config/constants';
import ContentContainer from '@/layouts/components/PageContainer/ContentContainer';
import { formatDateTime } from '@/utils/date';
import DictDataDrawer from './modules/dict-data-drawer';
import DictTypeDrawer from './modules/dict-type-drawer';
import { SEARCH_PLATFORM_OPTIONS, getCurrentPlatform } from './modules/shared';

const BULK_OK: Record<'enable' | 'disable' | 'delete', string> = {
  enable: '批量启用成功',
  disable: '批量禁用成功',
  delete: '批量删除成功',
};

function errMsg(err: unknown, fallback: string) {
  return (err as Error)?.message || fallback;
}

const DictPage = () => {
  const typeActionRef = useRef<ActionType | undefined>(undefined);
  const dataActionRef = useRef<ActionType | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<DictType | null>(null);
  const [typeSelectedKeys, setTypeSelectedKeys] = useState<React.Key[]>([]);
  const [dataSelectedKeys, setDataSelectedKeys] = useState<React.Key[]>([]);
  const [typeBulkLoading, setTypeBulkLoading] = useState(false);
  const [dataBulkLoading, setDataBulkLoading] = useState(false);
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [editingType, setEditingType] = useState<DictType | null>(null);
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);
  const [editingData, setEditingData] = useState<DictData | null>(null);

  const dictLookups = useDictLookups({
    typeCodes: ['sys_switch_status', 'sys_platform', 'sys_default_status'],
    includeGeneral: true,
    platformLabels: Object.fromEntries(SEARCH_PLATFORM_OPTIONS.map((o) => [o.value, o.label])),
  });
  const allTypesQuery = useListAllDictType({ status: 1 });
  const typeOptions = useMemo(
    () =>
      (allTypesQuery.data ?? []).map((t) => ({
        label: `${t.name}（${t.code}）`,
        value: t.id,
      })),
    [allTypesQuery.data],
  );

  const reloadType = () => typeActionRef.current?.reload?.();
  const reloadData = () => dataActionRef.current?.reload?.();
  const invalidateTypes = () => {
    void queryClient.invalidateQueries({ queryKey: ['listAllDictType'] });
  };

  const deleteTypeMut = useDeleteDictType({
    onSuccess: () => {
      message.success('删除成功');
      reloadType();
      invalidateTypes();
    },
    onError: (err) => message.error(`删除失败：${errMsg(err, '未知错误')}`),
  });
  const deleteDataMut = useDeleteDictData({
    onSuccess: () => {
      message.success('删除成功');
      reloadData();
    },
    onError: (err) => message.error(`删除失败：${errMsg(err, '未知错误')}`),
  });

  const runTypeBulk = async (action: 'enable' | 'disable' | 'delete') => {
    if (typeSelectedKeys.length === 0) {
      message.warning('请先勾选要操作的字典类型');
      return;
    }
    setTypeBulkLoading(true);
    try {
      await batchDictTypeApi({
        action,
        ids: typeSelectedKeys.map((k) => Number(k)),
      });
      message.success(BULK_OK[action]);
      setTypeSelectedKeys([]);
      reloadType();
      invalidateTypes();
    } catch (err) {
      message.error(`批量操作失败：${errMsg(err, '未知错误')}`);
    } finally {
      setTypeBulkLoading(false);
    }
  };

  const runDataBulk = async (action: 'enable' | 'disable' | 'delete') => {
    if (dataSelectedKeys.length === 0) {
      message.warning('请先勾选要操作的字典项');
      return;
    }
    setDataBulkLoading(true);
    try {
      await batchDictDataApi({
        action,
        ids: dataSelectedKeys.map((k) => Number(k)),
      });
      message.success(BULK_OK[action]);
      setDataSelectedKeys([]);
      reloadData();
    } catch (err) {
      message.error(`批量操作失败：${errMsg(err, '未知错误')}`);
    } finally {
      setDataBulkLoading(false);
    }
  };

  const typeColumns: ProColumns<DictType>[] = [
    { title: 'ID', dataIndex: 'id', width: 70, search: false },
    { title: '类型编码', dataIndex: 'code', width: 140, ellipsis: true },
    { title: '类型名称', dataIndex: 'name', width: 140, ellipsis: true },
    { title: '备注', dataIndex: 'remark', ellipsis: true, search: false },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      width: 90,
      search: false,
      render: (_, r) => (
        <Tag color={dictLookups.lookupSwitchTagType(r.isEnabled)}>
          {dictLookups.lookupSwitchLabel(r.isEnabled)}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      search: false,
      render: (_, r) => formatDateTime(r.updatedAt),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      search: false,
      render: (_, r) => [
        <a
          key="edit"
          onClick={(e) => {
            e.stopPropagation();
            setEditingType(r);
            setTypeDrawerOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="del"
          title="确定要删除该字典类型？"
          description="若仍有字典项将无法删除。"
          onConfirm={() => {
            deleteTypeMut.mutate(r.id);
            if (selectedType?.id === r.id) setSelectedType(null);
          }}
        >
          <a style={{ color: '#ff4d4f' }} onClick={(e) => e.stopPropagation()}>
            删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  const dataColumns: ProColumns<DictData>[] = [
    { title: 'ID', dataIndex: 'id', width: 70, search: false },
    { title: '类型编码', dataIndex: 'typeCode', width: 140, ellipsis: true, search: false },
    { title: '字典值', dataIndex: 'value', width: 120, ellipsis: true },
    { title: '字典标签', dataIndex: 'label', width: 140, ellipsis: true, search: false },
    {
      title: '归属平台',
      dataIndex: 'platform',
      width: 140,
      valueType: 'select',
      fieldProps: { options: SEARCH_PLATFORM_OPTIONS, allowClear: true },
      initialValue: getCurrentPlatform(),
      render: (_, r) => (
        <Tag color={dictLookups.lookupPlatformTagType(r.platform) ?? 'default'}>
          {dictLookups.lookupPlatformLabel(r.platform)}
        </Tag>
      ),
    },
    {
      title: '包含通用',
      dataIndex: 'includeGeneral',
      hideInTable: true,
      valueType: 'switch',
      initialValue: true,
    },
    { title: '排序', dataIndex: 'sort', width: 70, search: false },
    {
      title: '默认',
      dataIndex: 'isDefault',
      width: 80,
      search: false,
      render: (_, r) => (
        <Tag color={dictLookups.lookupDefaultTagType(r.isDefault) ?? 'default'}>
          {dictLookups.lookupDefaultLabel(r.isDefault)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      width: 90,
      search: false,
      render: (_, r) => (
        <Tag color={dictLookups.lookupSwitchTagType(r.isEnabled)}>
          {dictLookups.lookupSwitchLabel(r.isEnabled)}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      search: false,
      render: (_, r) => [
        <a
          key="edit"
          onClick={() => {
            setEditingData(r);
            setDataDrawerOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="del"
          title="确定要删除该字典项？"
          onConfirm={() => deleteDataMut.mutate(r.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ContentContainer scrollable>
      <Row gutter={16}>
        <Col span={24} md={12}>
          <Card size="small">
            <ProTable<DictType>
              rowKey="id"
              headerTitle="字典类型"
              actionRef={typeActionRef}
              columns={typeColumns}
              rowSelection={{
                selectedRowKeys: typeSelectedKeys,
                onChange: setTypeSelectedKeys,
              }}
              tableAlertRender={false}
              search={{ ...TABLE.SEARCH }}
              pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
              scroll={{ x: 800 }}
              onRow={(record) => ({
                onClick: () => setSelectedType(record),
                style: {
                  cursor: 'pointer',
                  background: selectedType?.id === record.id ? 'var(--ant-color-primary-bg)' : undefined,
                },
              })}
              request={async (params) => {
                const res = await listDictTypeApi({
                  page: params.current,
                  pageSize: params.pageSize,
                  code: (params.code as string) || undefined,
                  name: (params.name as string) || undefined,
                });
                return { data: res.items, total: res.total, success: true };
              }}
              toolBarRender={() =>
                typeSelectedKeys.length > 0
                  ? [
                      <span key="count">已选 {typeSelectedKeys.length} 条</span>,
                      <Button key="en" size="small" loading={typeBulkLoading} onClick={() => void runTypeBulk('enable')}>
                        批量启用
                      </Button>,
                      <Button key="dis" size="small" loading={typeBulkLoading} onClick={() => void runTypeBulk('disable')}>
                        批量禁用
                      </Button>,
                      <Popconfirm
                        key="del"
                        title="确定要删除选中的字典类型？"
                        description={`若仍有字典项将无法删除。当前共 ${typeSelectedKeys.length} 项。`}
                        onConfirm={() => void runTypeBulk('delete')}
                      >
                        <Button size="small" danger ghost loading={typeBulkLoading}>
                          批量删除
                        </Button>
                      </Popconfirm>,
                    ]
                  : [
                      <Button
                        key="create"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingType(null);
                          setTypeDrawerOpen(true);
                        }}
                      >
                        新建类型
                      </Button>,
                    ]
              }
            />
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card size="small">
            <ProTable<DictData>
              rowKey="id"
              headerTitle={
                <Space>
                  <span>字典数据</span>
                  {selectedType ? (
                    <Tag
                      color="blue"
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        setSelectedType(null);
                      }}
                    >
                      {selectedType.name}（{selectedType.code}）
                    </Tag>
                  ) : null}
                </Space>
              }
              actionRef={dataActionRef}
              columns={dataColumns}
              params={{ typeCode: selectedType?.code ?? '' }}
              rowSelection={{
                selectedRowKeys: dataSelectedKeys,
                onChange: setDataSelectedKeys,
              }}
              tableAlertRender={false}
              search={{ ...TABLE.SEARCH }}
              pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
              scroll={{ x: 900 }}
              request={async (params) => {
                const platform = (params.platform as string) || getCurrentPlatform();
                const res = await listDictDataApi({
                  page: params.current,
                  pageSize: params.pageSize,
                  typeCode: selectedType?.code,
                  value: (params.value as string) || undefined,
                  platform,
                  includeGeneral: params.includeGeneral !== false,
                });
                return { data: res.items, total: res.total, success: true };
              }}
              toolBarRender={() =>
                dataSelectedKeys.length > 0
                  ? [
                      <span key="count">已选 {dataSelectedKeys.length} 条</span>,
                      <Button key="en" size="small" loading={dataBulkLoading} onClick={() => void runDataBulk('enable')}>
                        批量启用
                      </Button>,
                      <Button key="dis" size="small" loading={dataBulkLoading} onClick={() => void runDataBulk('disable')}>
                        批量禁用
                      </Button>,
                      <Popconfirm
                        key="del"
                        title="确定要删除选中的字典项？"
                        onConfirm={() => void runDataBulk('delete')}
                      >
                        <Button size="small" danger ghost loading={dataBulkLoading}>
                          批量删除
                        </Button>
                      </Popconfirm>,
                    ]
                  : [
                      <Button
                        key="create"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingData(null);
                          setDataDrawerOpen(true);
                        }}
                      >
                        新建条目
                      </Button>,
                    ]
              }
            />
          </Card>
        </Col>
      </Row>
      <DictTypeDrawer
        open={typeDrawerOpen}
        row={editingType}
        onClose={() => setTypeDrawerOpen(false)}
        onSaved={() => {
          reloadType();
          invalidateTypes();
        }}
      />
      <DictDataDrawer
        open={dataDrawerOpen}
        row={editingData}
        defaultTypeId={selectedType?.id}
        typeOptions={typeOptions}
        onClose={() => setDataDrawerOpen(false)}
        onSaved={() => reloadData()}
      />
    </ContentContainer>
  );
};

export default DictPage;
