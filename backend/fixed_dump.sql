--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.alembic_version (version_num) FROM stdin;
c0fdddbf3f55
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.users (id, username, full_name, email, phone, hashed_password, profile_photo_path, verified, organization_id, group_id, user_status, created_at, updated_at) FROM stdin;
2	David	Авоков Давид Степанович	avakovd2000@ex.com	+79885634550	\x243262243132246a78354c57644c6d7a364b753345657546496d50524f4d4f4d76516e4d726570736f4e5a30502e33394f64493565646d3735634d36	\N	f	\N	\N	base_user	2026-03-08 11:18:07.719941+00	2026-03-08 12:40:07.431416+00
4	Lisa	Маконина Е. А.	lisamak.09@mail.ru	+79281543799	\x2432622431322435446758682f4f36614e65437366702f302f7974482e42316634794f315941596230343255706750784d6178696c41436d36524857	\N	f	\N	\N	base_user	2026-03-24 18:26:14.163421+00	2026-03-24 18:26:14.163421+00
5	Биба	Абобов 	vovchiktv32@mail.ru	+79882550625	\x243262243132244b7a7969346a46324f4d735947553168516a796b682e3765754262642e7241507174796858363053715a5a4a597357325574682e79	\N	f	\N	\N	base_user	2026-03-25 17:24:37.320175+00	2026-03-25 17:24:37.320175+00
6	Аня	Аня	anikulshinv@yandex.ru	+79530779189	\x24326224313224426b714441556244724e6e756e512f3154497147672e7050505643596b4f35654d6c595455436d4e4364335a52384a797057636847	\N	f	\N	\N	base_user	2026-03-25 18:58:44.139951+00	2026-03-25 18:58:44.139951+00
3	Sofka_st	Софья Тимофеевна Станчак	kichuklst@mail.ru	+79340351830	\x243262243132246b704b6366536c33794549506a32466f694f5956412e4934645a323730716d6a5961542f54316c774f4a377068694c466457795769	\N	f	\N	\N	base_user	2026-03-14 19:19:16.323779+00	2026-03-14 19:19:16.323779+00
8	SegaKissLove	Sergey Isaev	sergeyisaev007@mail.ru	+7 (952) 588-53-14	\x243262243132246b306a433338763071355158694c734c39436971384f745a5538794351347454793541676970305a68697147656c42626271785753	\N	f	\N	\N	base_user	2026-03-25 19:21:25.384369+00	2026-03-25 19:21:25.384369+00
1	alex	Авоков А.С.	s.avakov@icloud.com	+79953761533	\x243262243132242e4477375a66555546534e594856436e67552f61552e364a305a3472747a4445384b306431656b63675349385430574e456143762e	\N	f	\N	\N	base_user	2026-01-12 15:37:22.024414+00	2026-03-26 13:27:04.898286+00
\.


--
-- Data for Name: application_logs; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.application_logs (id, level, message, user_id, entity, entity_id, created_at) FROM stdin;
\.


--
-- Data for Name: email_confirmations; Type: TABLE DATA; Schema: public; Owner: user
-- ИСПРАВЛЕНО: добавлен timestamptz вместо timestamp
-- Таблица пока пустая, так что проблем нет
COPY public.email_confirmations (id, user_id, token, expires_at, created_at, new_email) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.tasks (id, title, description, deadline, created_by, worker_id, status, created_at, updated_at, updated_by) FROM stdin;
74849495-cbd6-4d4e-81ab-aac54664560f	Сдать курсовую	\N	2026-01-12 15:40:10.901+00	1	1	completed	2026-01-12 15:40:52.613873+00	2026-03-08 14:48:41.752356+00	1
474aff0d-0d09-4647-bcd5-9dc84df6df72	Убрать дом	Пропылесосить и помыть полы	2026-03-08 20:59:00+00	1	2	created	2026-03-08 12:16:01.606292+00	\N	\N
7305bb4c-b574-47ba-8e1b-9da4fe92f652	Покушац	Еда	2026-03-09 09:00:00+00	1	2	completed	2026-03-09 07:42:24.741288+00	2026-03-09 07:42:40.380721+00	2
36e27f48-2ba0-4365-8921-e0b748d752bd	Выспаться	Лечь в кроватку и спать сладко-сладко	2026-03-15 04:00:00+00	3	1	completed	2026-03-14 19:20:51.600505+00	2026-03-17 08:50:19.52601+00	1
a31d5652-614a-4fa9-a819-32569fba3c8e	Закончить диплом	Дописать диплом, согласовать с руководителем, защитить его 	2026-06-30 20:59:00+00	1	1	in_progress	2026-03-08 11:48:03.332616+00	2026-03-17 08:50:49.868901+00	1
23935095-5eca-4f4b-9efb-f0a29dc4c7aa	тест	1	2026-03-25 09:00:00+00	2	2	in_progress	2026-03-24 14:59:19.616422+00	\N	\N
51afffc6-7051-486b-a8aa-d8457c49f684	Долбануть ядеркой по Израилю	Раньше тут был смешной текст, но я случайно это все сбросил и второй раз писать мне лень:)	2026-03-31 09:00:00+00	5	5	created	2026-03-25 17:30:16.26938+00	\N	\N
1b948836-6fb6-4e2d-bd76-549d9023dd72	Закончить сводить концерт	Закончить сведение	2026-03-14 21:00:00+00	1	2	completed	2026-03-08 11:54:07.818412+00	2026-03-25 18:30:52.244952+00	1
3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	Муууужиииик~~~~	\N	2026-03-26 09:00:00+00	1	8	created	2026-03-25 19:22:33.780301+00	\N	\N
\.


--
-- Data for Name: file_attachments; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.file_attachments (id, task_id, filename, content_type, file_path, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.organizations (id, name, director_id, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.groups (id, name, manager_id, organization_id, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.notifications (id, recipient_id, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: subtasks; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.subtasks (id, task_id, title, is_done, created_at) FROM stdin;
\.


--
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.task_comments (id, task_id, author_id, text, created_at) FROM stdin;
\.


--
-- Data for Name: task_permissions; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.task_permissions (id, task_id, user_id, permission) FROM stdin;
7	74849495-cbd6-4d4e-81ab-aac54664560f	1	view
8	74849495-cbd6-4d4e-81ab-aac54664560f	1	edit
9	74849495-cbd6-4d4e-81ab-aac54664560f	1	delete
10	74849495-cbd6-4d4e-81ab-aac54664560f	1	assign
11	74849495-cbd6-4d4e-81ab-aac54664560f	1	change_status
12	74849495-cbd6-4d4e-81ab-aac54664560f	1	manage_permissions
23	a31d5652-614a-4fa9-a819-32569fba3c8e	1	view
24	a31d5652-614a-4fa9-a819-32569fba3c8e	1	edit
25	a31d5652-614a-4fa9-a819-32569fba3c8e	1	delete
26	a31d5652-614a-4fa9-a819-32569fba3c8e	1	assign
27	a31d5652-614a-4fa9-a819-32569fba3c8e	1	change_status
28	a31d5652-614a-4fa9-a819-32569fba3c8e	1	manage_permissions
29	1b948836-6fb6-4e2d-bd76-549d9023dd72	1	view
30	1b948836-6fb6-4e2d-bd76-549d9023dd72	1	edit
31	1b948836-6fb6-4e2d-bd76-549d9023dd72	1	delete
32	1b948836-6fb6-4e2d-bd76-549d9023dd72	1	assign
33	1b948836-6fb6-4e2d-bd76-549d9023dd72	1	change_status
34	1b948836-6fb6-4e2d-bd76-549d9023dd72	1	manage_permissions
35	1b948836-6fb6-4e2d-bd76-549d9023dd72	2	view
36	1b948836-6fb6-4e2d-bd76-549d9023dd72	2	change_status
37	1b948836-6fb6-4e2d-bd76-549d9023dd72	2	add_comment
38	1b948836-6fb6-4e2d-bd76-549d9023dd72	2	add_attachment
39	474aff0d-0d09-4647-bcd5-9dc84df6df72	1	view
40	474aff0d-0d09-4647-bcd5-9dc84df6df72	1	edit
41	474aff0d-0d09-4647-bcd5-9dc84df6df72	1	delete
42	474aff0d-0d09-4647-bcd5-9dc84df6df72	1	assign
43	474aff0d-0d09-4647-bcd5-9dc84df6df72	1	change_status
44	474aff0d-0d09-4647-bcd5-9dc84df6df72	1	manage_permissions
45	474aff0d-0d09-4647-bcd5-9dc84df6df72	2	view
46	474aff0d-0d09-4647-bcd5-9dc84df6df72	2	change_status
47	474aff0d-0d09-4647-bcd5-9dc84df6df72	2	add_comment
48	474aff0d-0d09-4647-bcd5-9dc84df6df72	2	add_attachment
49	7305bb4c-b574-47ba-8e1b-9da4fe92f652	1	view
50	7305bb4c-b574-47ba-8e1b-9da4fe92f652	1	edit
51	7305bb4c-b574-47ba-8e1b-9da4fe92f652	1	delete
52	7305bb4c-b574-47ba-8e1b-9da4fe92f652	1	assign
53	7305bb4c-b574-47ba-8e1b-9da4fe92f652	1	change_status
54	7305bb4c-b574-47ba-8e1b-9da4fe92f652	1	manage_permissions
55	7305bb4c-b574-47ba-8e1b-9da4fe92f652	2	view
56	7305bb4c-b574-47ba-8e1b-9da4fe92f652	2	change_status
57	7305bb4c-b574-47ba-8e1b-9da4fe92f652	2	add_comment
58	7305bb4c-b574-47ba-8e1b-9da4fe92f652	2	add_attachment
59	36e27f48-2ba0-4365-8921-e0b748d752bd	3	view
60	36e27f48-2ba0-4365-8921-e0b748d752bd	3	edit
61	36e27f48-2ba0-4365-8921-e0b748d752bd	3	delete
62	36e27f48-2ba0-4365-8921-e0b748d752bd	3	assign
63	36e27f48-2ba0-4365-8921-e0b748d752bd	3	change_status
64	36e27f48-2ba0-4365-8921-e0b748d752bd	3	manage_permissions
65	36e27f48-2ba0-4365-8921-e0b748d752bd	1	view
66	36e27f48-2ba0-4365-8921-e0b748d752bd	1	change_status
67	36e27f48-2ba0-4365-8921-e0b748d752bd	1	add_comment
68	36e27f48-2ba0-4365-8921-e0b748d752bd	1	add_attachment
69	23935095-5eca-4f4b-9efb-f0a29dc4c7aa	2	view
70	23935095-5eca-4f4b-9efb-f0a29dc4c7aa	2	edit
71	23935095-5eca-4f4b-9efb-f0a29dc4c7aa	2	delete
72	23935095-5eca-4f4b-9efb-f0a29dc4c7aa	2	assign
73	23935095-5eca-4f4b-9efb-f0a29dc4c7aa	2	change_status
74	23935095-5eca-4f4b-9efb-f0a29dc4c7aa	2	manage_permissions
75	51afffc6-7051-486b-a8aa-d8457c49f684	5	view
76	51afffc6-7051-486b-a8aa-d8457c49f684	5	edit
77	51afffc6-7051-486b-a8aa-d8457c49f684	5	delete
78	51afffc6-7051-486b-a8aa-d8457c49f684	5	assign
79	51afffc6-7051-486b-a8aa-d8457c49f684	5	change_status
80	51afffc6-7051-486b-a8aa-d8457c49f684	5	manage_permissions
81	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	1	view
82	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	1	edit
83	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	1	delete
84	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	1	assign
85	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	1	change_status
86	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	1	manage_permissions
87	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	8	view
88	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	8	change_status
89	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	8	add_comment
90	3e2fe950-dfcd-4b2a-82b3-ddf16cf025fc	8	add_attachment
\.


--
-- Data for Name: task_templates; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.task_templates (id, title, description, organization_id, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: tasks_history; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.tasks_history (id, task_id, old_status, new_status, changed_at, changed_by) FROM stdin;
\.


--
-- Name: application_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.application_logs_id_seq', 1, false);


--
-- Name: email_confirmations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.email_confirmations_id_seq', 1, false);


--
-- Name: file_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.file_attachments_id_seq', 1, false);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, false);


--
-- Name: subtasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.subtasks_id_seq', 1, false);


--
-- Name: task_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.task_comments_id_seq', 1, false);


--
-- Name: task_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.task_permissions_id_seq', 90, true);


--
-- Name: task_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.task_templates_id_seq', 1, false);


--
-- Name: tasks_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.tasks_history_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--